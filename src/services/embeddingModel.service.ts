import { pipeline } from "@xenova/transformers";

export class EmbeddingModelService {

    private static instance: EmbeddingModelService;
    private embedder: any;

    private constructor() {}

    static getInstance() {
        if (!this.instance) {
            this.instance = new EmbeddingModelService();
        }
        return this.instance;
    }

    async initialize() {

        if (!this.embedder) {

            this.embedder = await pipeline(
                "feature-extraction",
                "Xenova/all-MiniLM-L6-v2"
            );

            console.log("Modelo de embeddings cargado.");
        }

    }

    async embed(text: string): Promise<number[]> {

        if (!this.embedder) {
            throw new Error("El modelo no está inicializado.");
        }

        const embedding = await this.embedder(text, {
            pooling: "mean",
            normalize: true
        });

        return Array.from(embedding.data);
    }

}