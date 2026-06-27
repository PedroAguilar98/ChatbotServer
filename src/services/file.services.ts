import { FileRepository } from "../repository/file.repository";

export class FileService {

    async create(file: Express.Multer.File){
        const file_repository = new FileRepository()
        const document = await file_repository.create({
            name:file.originalname,
            mime_type:file.mimetype,
            tenant_id:1,
            stored_name:file.filename
        })
        return document;
    }

}