import OpenAI from "openai";
import { embeddingModelService } from "..";
import { EmbeddingService } from "./embedding.service";
import { Response } from "express";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export class LLMService{
    private client: OpenAI;
    private embeddingService: EmbeddingService = new EmbeddingService()

    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: "https://api.groq.com/openai/v1",
        });
    }


    async ask(tenantId:number,question: string, res:Response, previousQuestions:{question:string, answer:string}[] = []) {

        const embeddedQuestion = await embeddingModelService.embed(question)
        const results = await this.embeddingService.getPerTenant(tenantId, embeddedQuestion)
        const prevChat:ChatCompletionMessageParam[] = previousQuestions.flatMap(p => [
                    {
                        role: "user",
                        content: p.question,
                    },
                    {
                        role: "assistant",
                        content: p.answer,
                    }
                ])
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
                        Formatea las respuestas utilizando Markdown.
                        - Usa listas cuando sea conveniente.
                        - Usa tablas cuando ayuden a explicar información.
                        - Usa encabezados para organizar respuestas largas.
                        - Usa negrita para destacar conceptos importantes.
                        - No incluyas bloques de Markdown innecesarios.
                                `
                },
                ...prevChat,
                {
                    role: "system",
                    content: `
                        Fragmentos relevantes:

                        ${results.map(r => r.fragment).join("\n\n")}

                        Títulos de los textos de los fragmentos relevantes:
                        ${results.map(r => r.name).join("\n\n")}
                    `
                },
                {
                    role: "user",
                    content: `

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
                res.write(token)
            }

        }
        res.end()
    }
}

export const llmService = new LLMService();