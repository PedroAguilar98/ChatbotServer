import OpenAI from "openai";
import { embeddingModelService } from "..";
import { EmbeddingService } from "./embedding.service";
import { Response } from "express";


export class LLMService{
    private client: OpenAI;
    private embeddingService: EmbeddingService = new EmbeddingService()

    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: "https://api.groq.com/openai/v1",
        });
    }


    async ask(tenantId:number,question: string, res:Response, previousQuestion:string[] = []) {
        const embeddedQuestion = await embeddingModelService.embed(question)
        const results = await this.embeddingService.getPerTenant(tenantId, embeddedQuestion)
        const context = `

            Fragmentos relevantes:
            ${results.map(r => r.fragment).join("\n\n")}

            Preguntas anteriores:
            ${previousQuestion.map(p => p).join("\n\n")}
        `
        const response = await this.client.chat.completions.create({ //await ollama.chat({
            model: "llama-3.1-8b-instant",//"mistral",
            stream: true,
            messages: [
                { role: "system", content: "Eres un asistente que responde con base en documentos recuperados." },
                { role: "user", content: `Contexto:\n${context}\n\nPregunta: ${question}\nRespuesta:` }
            ]
        });

        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Transfer-Encoding", "chunked");
        res.setHeader("Cache-Control", "no-cache");

        for await (const chunk of response) {

            const token = chunk.choices[0]?.delta?.content;

            if (token) {
                res.write(token);
            }

        }
        res.end()
    }
}

export const llmService = new LLMService();