import OpenAI from "openai";
import { embeddingModelService } from "..";
import { EmbeddingService } from "./embedding.service";


export class LLMService{
    private client: OpenAI;
    private embeddingService: EmbeddingService = new EmbeddingService()

    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: "https://api.groq.com/openai/v1",
        });
    }


    async ask(tenantId:number,question: string, previousQuestion:string[] = []) {
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
            messages: [
                { role: "system", content: "Eres un asistente que responde con base en documentos recuperados." },
                { role: "user", content: `Contexto:\n${context}\n\nPregunta: ${question}\nRespuesta:` }
            ]
        });
        return response.choices[0]?.message.content;
    }
}

export const llmService = new LLMService();