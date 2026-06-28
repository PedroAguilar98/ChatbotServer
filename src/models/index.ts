import { EmbeddingModel } from "./EmbeddingModel";
import { FileModel } from "./FileModel";

FileModel.hasMany(EmbeddingModel, {
    foreignKey: "file_id"
});

EmbeddingModel.belongsTo(FileModel, {
    foreignKey: "file_id"
});