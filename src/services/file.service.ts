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