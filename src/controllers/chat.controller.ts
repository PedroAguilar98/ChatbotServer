import { Request, Response } from "express";
import { llmService } from "../services/llm.service";

export class ChatController {
    async promptQuestion(req: Request, res: Response){
        try{
            const body = req.body
            const answer = await llmService.ask(body.tenantId, body.question)
            return res.json({
                ok:true,
                answer
            });
        }catch(error){
            return res.json({
                ok:false,
                error
            });
        }
    }
}