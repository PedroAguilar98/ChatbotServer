import express from "express";
import cors from "cors";

import fileRoutes from "./routes/file.routes";
import { noCacheMiddleware } from "./middleware/noCache.middleware";

const app = express();

app.use(express.json());

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use(noCacheMiddleware);

app.use("/files", fileRoutes);

const port = 3000;

app.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`);
});