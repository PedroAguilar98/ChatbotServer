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

router.get(
    "/byTenant/:tenant_id",
    controller.getFiles
);
    
export default router;