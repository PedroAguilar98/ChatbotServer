import { FileRepository } from "../repository/file.repository";
import { readFile } from "node:fs/promises";
import { PDFParse } from "pdf-parse";
import mammoth from 'mammoth'
import fs from 'fs'
import { ChunkService } from "./chunk.service";
import { EmbeddingService } from "./embedding.service";

const parsePDF = async (filePath:string) =>{
    const buffer = await readFile(filePath);

    const parser = new PDFParse({
        data: buffer
    });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
}

const parseDOCX = async (filePath:string) =>{
    const result = await mammoth.extractRawText({
        path: filePath
    });

    return result.value;

}

const parseTXT = (filePath:string) =>{
    const text = fs.readFileSync(
        filePath,
        "utf8"
    );
    return text
}

export class FileService {

    constructor(
        private chunkService: ChunkService = new ChunkService(),
        private embeddingService: EmbeddingService = new EmbeddingService(),
    ) {}

    async create(file: Express.Multer.File){
        const file_repository = new FileRepository()
        const fileCreated = await file_repository.create({
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
            return parseDOCX(props.filePath)
        }
        if(props.mimeType === 'text/plain'){
            return parseTXT(props.filePath)
        }
        if(props.mimeType === 'text/csv'){
        }
        if(props.mimeType === 'text/html'){
        }
        if(props.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'){
        }
        if(props.mimeType === 'text/markdown'){
        }
    }

}