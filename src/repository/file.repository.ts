import { where, WhereOptions } from "sequelize";
import { FileAttributes, FileCreationAttributes, FileModel } from "../models/FileModel";

export class FileRepository {

    async create(data: FileCreationAttributes) {
        return await FileModel.create(data);
    }

    async delete(id:number){
        return await FileModel.destroy({where:{id}})
    }

    async getOne(id:number){
        return await FileModel.findOne({
            where:{id}
        })
    }

    async getMany(attributes:string[], where:WhereOptions<FileAttributes>){
        return await FileModel.findAll(
            {attributes:attributes, where:where},
        )
    }

}