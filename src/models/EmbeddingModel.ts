import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from "sequelize";
import { sequelize } from "../db";
import { FileModel } from "./FileModel";

interface EmbeddingAttributes {
    id: number;
    file_id: number;
    chunk_index: number;
    fragment: string;
    embedding: number[];
    created_at: Date;
}

export interface EmbeddingCreationAttributes
    extends Omit<EmbeddingAttributes, "id" | "created_at"> {}

export class EmbeddingModel extends Model<EmbeddingAttributes, EmbeddingCreationAttributes>
    implements EmbeddingAttributes {

    declare id: CreationOptional<number>;

    declare file_id: number;

    declare chunk_index: number;

    declare fragment: string;

    declare embedding: number[];

    declare created_at:Date
}

EmbeddingModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true,
        },
        file_id:{
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        chunk_index:{
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        fragment:{
            type: DataTypes.STRING,
            allowNull: false,
        },
        embedding:{
            type: DataTypes.JSONB,
            allowNull: false,
        },
        created_at:{
            type: DataTypes.STRING,
            allowNull: true,
        }
    },
    {
        sequelize,
        tableName: "embeddings",
        timestamps: false
    }
)