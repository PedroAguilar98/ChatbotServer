import { Request, Response } from "express";
import { llmService } from "../services/llm.service";

export class ChatController {
    async promptQuestion(req: Request, res: Response){
        try{
            const body = req.body
            await llmService.ask(body.tenantId, body.question, res, body.prevChat)
        }catch(error){
            return res.json({
                ok:false,
                error
            });
        }
    }
}