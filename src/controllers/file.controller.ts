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
            await  fileService.deleteFile(Number(id))
            return res.json({ok:true});
        } catch(err){
            return res.json({
                ok:false,
                msg:err
            });
        }
    }

    async getFiles(req: Request, res: Response){
        try{
            const {tenant_id} = req.params
            const fileService = new FileService()
            const files =  await fileService.getFiles(Number(tenant_id))
            return res.json({
                ok:true,
                files
            })
        }catch{
            return res.json({
                ok:false
            })
        }
    }

}