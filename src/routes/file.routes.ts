import { Router } from "express";
import { FileController } from "../controllers/file.controller";
import { upload } from "../middleware/upload.middleware";

const router = Router();

const controller = new FileController();

router.post(
    "/",
    upload.single("file"),
    controller.addFile
);

router.delete(
    "/:id",
    controller.deleteFile
);
    
export default router;