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

            Títulos de los textos de los fragmentos relevantes:
            ${results.map(r => r.name).join("\n\n")}

            Preguntas anteriores:
            ${previousQuestion.map(p => p).join("\n\n")}
        `
        const response = await this.client.chat.completions.create({ //await ollama.chat({
            model: "llama-3.1-8b-instant",//"mistral",
            stream: true,
            messages: [
                {
                    role: "system",
                    content: `
                        Eres un asistente para responder preguntas utilizando únicamente la información proporcionada en el contexto.

                        Reglas:
                        - Responde siempre en el idioma del usuario.
                        - Si el contexto contiene la respuesta, responde de forma clara y concisa.
                        - Si el contexto no contiene suficiente información, di que no puedes responder con la información disponible.
                        - No inventes información.
                        - No hagas suposiciones.
                        - Si existen varias respuestas posibles en el contexto, explícalas.
                        - Si una respuesta requiere información de varios documentos, combínala.
                        - No menciones que recibiste un contexto.
                        - No cites texto literalmente salvo que sea necesario.
                        - Mantén un tono profesional.
                                `
                },
                {
                    role: "user",
                    content: `
                        Contexto:

                        ${context}

                        Pregunta:

                        ${question}
                                `
                }
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