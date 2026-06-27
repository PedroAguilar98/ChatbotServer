import { DataTypes } from "sequelize";
import { sequelize } from "../db";

export const FileModel = sequelize.define('files', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
    },
    name:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    tenant_id:{
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue:1
    },
    mime_type:{
        type: DataTypes.STRING,
        allowNull: false,
    },
},{timestamps:false})