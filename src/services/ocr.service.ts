import { createWorker, Worker } from "tesseract.js";

export class OCRService {

    private static instance: OCRService;
    private worker?: Worker;

    private constructor() {}

    static getInstance() {
        if (!this.instance) {
            this.instance = new OCRService();
        }
        return this.instance;
    }

    async initialize() {

        if (!this.worker) {

            this.worker = await createWorker(["eng", "spa"]);

            console.log("Modelo de OCR cargado.");
        }

    }

    async recognize(image: Buffer): Promise<string> {

        if (!this.worker) {
            throw new Error("El modelo de OCR no está inicializado.");
        }

        const { data } = await this.worker.recognize(image);

        return data.text;
    }

}
