import { Request, Response } from "express";
import { FileService } from "../services/file.service";

export class FileController {

    async addFile(req: Request, res: Response) {
        const fileService = new FileService()
        if(req.file){
            await fileService.create(req.file)
        }
        const response = {};

        return res.json(response);

    }

}