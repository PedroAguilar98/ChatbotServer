
import "dotenv/config";
import express from "express";
import cors from "cors";

import fileRoutes from "./routes/file.routes";
import { noCacheMiddleware } from "./middleware/noCache.middleware";
import { EmbeddingModelService } from "./services/embeddingModel.service";
import chatRoutes from "./routes/chat.routes";

const app = express();

export const embeddingModelService = EmbeddingModelService.getInstance()

async function main() {
    app.use(express.json());

    app.use(cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    }));

    app.use(noCacheMiddleware);

    app.use("/files", fileRoutes);

    app.use("/chat", chatRoutes);

    
    await embeddingModelService.initialize();

    const port = 3000;

    app.listen(port, () => {
        console.log(`Servidor corriendo en puerto ${port}`);
    });
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});