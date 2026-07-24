import { FileRepository } from "../repository/file.repository";
import { readFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";
import mammoth from 'mammoth'
import fs from 'fs'
import * as fsPromise from "fs/promises";
import { parse } from "csv-parse/sync";
import { ChunkService } from "./chunk.service";
import { EmbeddingService } from "./embedding.service";
import { unlinkFile } from "../utils/unlinkFile";
import XLSX from "xlsx";
import { load } from "cheerio";
import JSZip from "jszip";
import { ocrService } from "..";

const IMAGE_EXTENSION = /\.(png|jpe?g|bmp|gif|tiff?)$/i;

const loadZip = async (filePath: string) => JSZip.loadAsync(await readFile(filePath));

const extractZipImages = async (zip: JSZip, mediaPathPrefix: string) => {
    const entries = Object.keys(zip.files).filter(
        name => name.startsWith(mediaPathPrefix) && IMAGE_EXTENSION.test(name)
    );

    const images: { name: string; buffer: Buffer }[] = [];

    for (const name of entries) {
        const entry = zip.file(name);

        if (!entry)
            continue;

        images.push({ name, buffer: await entry.async("nodebuffer") });
    }

    return images;
};

const ocrImages = async (images: { name: string; buffer: Buffer | Uint8Array }[]) => {
    let text = "";

    for (const image of images) {
        const recognized = (await ocrService.recognize(Buffer.from(image.buffer))).trim();

        if (recognized) {
            text += `\n--- OCR: ${image.name} ---\n${recognized}`;
        }
    }

    return text;
};

const parsePDF = async (filePath:string) =>{
    const buffer = await readFile(filePath);

    const parser = new PDFParse({
        data: buffer
    });
    const result = await parser.getText();
    const imageResult = await parser.getImage();
    await parser.destroy();

    const images = imageResult.pages.flatMap(page =>
        page.images.map(image => ({
            name: `page ${page.pageNumber} - ${image.name}`,
            buffer: image.data
        }))
    );

    return result.text + await ocrImages(images);
}

const parseDOCX = async (filePath:string) =>{
    const [result, zip] = await Promise.all([
        mammoth.extractRawText({ path: filePath }),
        loadZip(filePath)
    ]);

    const images = await extractZipImages(zip, "word/media/");

    return result.value + await ocrImages(images);

}

const parseTXT = (filePath:string) =>{
    const text = fs.readFileSync(
        filePath,
        "utf8"
    );
    return text
}

const decodeXmlEntities = (text: string) =>
    text
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&");

const parsePPTX = async (filePath: string) => {
    const zip = await loadZip(filePath);

    const slideFiles = Object.keys(zip.files)
        .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
        .sort((a, b) => {
            const numA = Number(a.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
            const numB = Number(b.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
            return numA - numB;
        });

    let text = "";

    for (const slideFile of slideFiles) {
        const entry = zip.file(slideFile);

        if (!entry)
            continue;

        const xml = await entry.async("string");

        const runs = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)]
            .map(match => decodeXmlEntities(match[1] ?? ""))
            .join(" ");

        if (runs.trim()) {
            text += `\n--- ${slideFile} ---\n${runs}`;
        }
    }

    const images = await extractZipImages(zip, "ppt/media/");

    text += await ocrImages(images);

    return text;
};

const parseCSV = async (filePath: string) => {
    const content = await fsPromise.readFile(filePath, "utf8");

    const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
    });

    return records
        .map((row:any) =>
            Object.entries(row)
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ")
        )
        .join("\n");
};

const parseExcel = async (filePath: string) => {
    const workbook = XLSX.readFile(filePath);

    let text = "";

    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];

        if(!sheet)
            return ''

        text += `\n--- ${sheetName} ---\n`;

        text += XLSX.utils.sheet_to_csv(sheet);
    });

    return text;
};

const parseHTML = async (filePath: string) => {
    const html = await fsPromise.readFile(filePath, "utf8");

    const $ = load(html);

    return $("body").text().replace(/\s+/g, " ").trim();
};

const parseMarkdown = async (filePath: string) => {
    return await fsPromise.readFile(filePath, "utf8");
};

export class FileService {

    constructor(
        private chunkService: ChunkService = new ChunkService(),
        private embeddingService: EmbeddingService = new EmbeddingService(),
        private fileRepository = new FileRepository(),
    ) {}

    async create(file: Express.Multer.File){
        const fileCreated = await this.fileRepository.create({
            name:file.originalname,
            mime_type:file.mimetype,
            tenant_id:1,
            stored_name:file.filename
        })
        const textToEmbed = await this.parseFile({filePath:file.path, mimeType:file.mimetype});
        const chunks = this.chunkService.split(textToEmbed ?? '')
        
        //concurrencia controlada
        const concurrency = 5;

        for (let i = 0; i < chunks.length; i += concurrency) {
            const batch = chunks.slice(i, i + concurrency);
            this.embeddingService.create(batch, fileCreated.id)
        }
        
    }

    async parseFile(props:{filePath:string, mimeType:string}){
        if(props.mimeType === 'application/pdf'){
            return parsePDF(props.filePath)
        }
        if(props.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'){
            return await parseDOCX(props.filePath)
        }
        if(props.mimeType === 'text/plain'){
            return parseTXT(props.filePath)
        }
        if(props.mimeType === 'text/csv'){
            return await parseCSV(props.filePath)
        }
        if(props.mimeType === 'text/html'){
            return await parseHTML(props.filePath)
        }
        if(props.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'){
            return await parseExcel(props.filePath)
        }
        if(props.mimeType === 'text/markdown'){
            return await parseMarkdown(props.filePath)
        }
        if(props.mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'){
            return await parsePPTX(props.filePath)
        }
    }

    async deleteFile(id:number){
        const fileToDelete = await this.fileRepository.getOne(id)
        await unlinkFile(fileToDelete?.stored_name)
        await this.embeddingService.deleteEmbedding(id)
        await this.fileRepository.delete(id)

    }

    async getFiles(tenant_id:number){
        return await this.fileRepository.getMany(
            ['id', 'name', 'mime_type', 'stored_name'],
            {tenant_id}
        )
    }

}