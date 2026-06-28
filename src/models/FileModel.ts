import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../db";
import { EmbeddingModel } from "./EmbeddingModel";

interface FileAttributes {
    id: number;
    name: string;
    tenant_id: number;
    mime_type: string;
    stored_name: string;
    created_at: Date;
}

export interface FileCreationAttributes
    extends Omit<FileAttributes, "id" | "created_at"> {}

export class FileModel extends Model<FileAttributes, FileCreationAttributes>
    implements FileAttributes {

    declare id: CreationOptional<number>;

    declare name: string;

    declare tenant_id: number;

    declare mime_type: string;

    declare stored_name: string;

    declare created_at:Date
}

FileModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false
        },

        tenant_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },

        mime_type: {
            type: DataTypes.STRING,
            allowNull: false
        },

        stored_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        
        created_at:{
            type: DataTypes.STRING,
            allowNull: true,
        }
    },
    {
        sequelize,
        tableName: "files",
        timestamps: false
    }
);