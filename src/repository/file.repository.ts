import { FileCreationAttributes, FileModel } from "../models/FileModel";

export class FileRepository {

    async create(data: FileCreationAttributes) {
        return await FileModel.create(data);
    }

    async delete(id:number){
        return await FileModel.destroy({where:{id}})
    }

}