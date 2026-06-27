import { Request, Response } from "express";

export class FileController {

    async addFile(req: Request, res: Response) {

        console.log("req", req)
        const response = {};

        return res.json(response);

    }

}