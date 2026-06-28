import { Request, Response } from "express";
import { FileService } from "../services/file.service";

export class FileController {

    async addFile(req: Request, res: Response) {
        try{
            const fileService = new FileService()
            if(req.file){
                await fileService.create(req.file)
            } else {
                return res.json({
                    ok:false,
                    msg:'Hubo un problema al importar el archivo'
                });
            }
            const response = {
                ok:true, msg:'Archivo subido correctamente'
            };

            return res.json(response);
        } catch(err){
            return res.json({
                ok:false,
                msg:err
            });
        }
        

    }

    async deleteFile(req: Request, res: Response){
        try{
            const fileService = new FileService()
            const {id} = req.params
            console.log("id",id)
            await  fileService.deleteFile(Number(id))
            return res.json({ok:true});
        } catch(err){
            return res.json({
                ok:false,
                msg:err
            });
        }
    }

}