import { DataTypes } from "sequelize";
import { sequelize } from "../db";
import { FileModel } from "./FileModel";

export const EmbeddingModel = sequelize.define('embeddings', {
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
},{timestamps:false})

EmbeddingModel.hasOne(FileModel, {
    foreignKey: 'id',
    sourceKey: 'fileId',
});