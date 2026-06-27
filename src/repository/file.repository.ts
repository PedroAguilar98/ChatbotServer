import { FileModel } from "../models/FileModel";

export class FileRepository {

    async create(data: {
        name: string;
        mime_type: string;
        tenant_id: number,
        stored_name:string
    }) {
        console.log("data", data)
        return await FileModel.create({
            ...data,
            created_at: new Date()
        });

    }

}