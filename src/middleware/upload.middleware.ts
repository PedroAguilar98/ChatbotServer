import multer from "multer";
import path from "path";

export const upload = multer({
    storage: multer.diskStorage({
        destination: "uploads/",
        filename(req, file, cb) {

            const filename =
                crypto.randomUUID() +
                path.extname(file.originalname);

            cb(null, filename);
        }
    })
});