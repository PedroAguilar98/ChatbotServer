import { Request, Response } from "express";
import { FileService } from "../services/file.services";

export class FileController {

    async addFile(req: Request, res: Response) {
        const fileService = new FileService()
        if(req.file){
            fileService.create(req.file)
        }
        const response = {};

        return res.json(response);

    }

}