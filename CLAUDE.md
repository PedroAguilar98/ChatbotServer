# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the server with hot reload (`tsx watch src/index.ts`), listens on port 3000.
- `npm run build` — type-check and compile to `dist/` via `tsc`.
- `npm start` — run the compiled server (`node dist/index.js`), requires `build` first.
- There is no test suite configured (`npm test` is a placeholder that exits with an error).

## Environment

Configuration is loaded via `dotenv` from a `.env` file (gitignored) at the project root. Required variables:

- `OPENAI_API_KEY` — actually a Groq API key; the OpenAI SDK client in `llm.service.ts` is pointed at `https://api.groq.com/openai/v1`.
- `NEON_HOST`, `NEON_PORT`, `NEON_PASS`, `NEON_ROLE` — connection details for a Neon Postgres database (SSL required, see `src/db.ts`).

The Postgres database must have the `pgvector` extension enabled — the `embeddings` table is queried with the `<=>` cosine-distance operator (see `embedding.repository.ts`) even though the Sequelize model declares the `embedding` column as `JSONB`. Sequelize does not manage migrations here; tables (`files`, `embeddings`) are assumed to already exist with a `vector` column type.

## Architecture

This is a multi-tenant RAG (Retrieval-Augmented Generation) chatbot server: upload documents, embed their contents locally, and answer questions by retrieving relevant chunks and passing them to an LLM. Layering follows routes → controllers → services → repositories → Sequelize models, e.g. `file.routes.ts` → `FileController` → `FileService` → `FileRepository` → `FileModel`.

### File ingestion pipeline (`FileService.create`, `src/services/file.service.ts`)

1. `upload.middleware.ts` (multer) stores the raw upload under `uploads/` with a random UUID filename.
2. `FileService.parseFile` dispatches by MIME type to a dedicated parser (PDF via `pdf-parse`, DOCX via `mammoth`, PPTX via manual `JSZip`/XML parsing of `ppt/slides/*.xml`, XLSX via `xlsx`, CSV via `csv-parse`, HTML via `cheerio`, plus TXT/Markdown).
3. For PDF, DOCX, and PPTX, embedded raster images are additionally extracted (via `pdf-parse`'s `getImage()` for PDF, or by reading `word/media/`/`ppt/media/` out of the OOXML zip for DOCX/PPTX) and run through OCR (`ocr.service.ts`, backed by `tesseract.js` with `eng`+`spa` language models). Recognized text is appended to the document text as `--- OCR: <name> ---` blocks. OCR runs on every extracted image with no confidence filtering, so non-text images (photos, logos) can inject noisy text into the corpus.
4. The combined text is chunked by `ChunkService.split` (2000 chars, 200 overlap, no awareness of the `--- OCR: ... ---` markers, so a chunk can straddle real text and OCR text).
5. Chunks are embedded in batches of 5 via `EmbeddingService.create`, which calls the shared `embeddingModelService` (singleton wrapping `@xenova/transformers`, model `Xenova/all-MiniLM-L6-v2`, initialized once at server startup in `index.ts`) and bulk-inserts rows into `embeddings`. Note: in `FileService.create` this batch loop does not `await` `embeddingService.create`, so embedding creation is fire-and-forget relative to the HTTP response.

`FileService.deleteFile` removes the stored file from disk, its embeddings, and its `files` row.

### Chat / retrieval pipeline (`LLMService.ask`, `src/services/llm.service.ts`)

1. The incoming question is embedded with the same local `embeddingModelService`.
2. `EmbeddingRepository.getEmbeddingsPerClient` runs a raw SQL query joining `embeddings`/`files`, filtered by `tenant_id` and ordered by pgvector cosine distance (`<=>`), returning the top 5 fragments.
3. A prompt is assembled: a fixed Spanish system prompt (answer only from context, Markdown formatting rules), the client-supplied `prevChat` history (chat history is **not** persisted server-side — the caller must resend it each request), the retrieved fragments, and the question.
4. The response is streamed token-by-token from Groq (`llama-3.1-8b-instant`) directly to the HTTP response as chunked plain text.

### Multi-tenancy

`tenant_id` is modeled throughout (`FileModel`, the embeddings retrieval query) but there is no auth/session layer — `FileService.create` currently hardcodes `tenant_id: 1` for every upload.

`eng.traineddata` and `spa.traineddata` in the project root are Tesseract language models auto-downloaded and cached by `tesseract.js` on first OCR use. They are not currently listed in `.gitignore`, so they show up as untracked files after running OCR.

### Singletons initialized at startup

`index.ts` builds `embeddingModelService` and `ocrService` as singletons and awaits their `initialize()` before the HTTP server starts listening. Both are expensive to construct (loading a transformer model / a Tesseract worker), so they must not be re-instantiated per-request — services obtain them via `import { embeddingModelService, ocrService } from ".."` (the `src/index.ts` barrel), not via `new`.
