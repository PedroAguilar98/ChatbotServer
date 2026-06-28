import { EmbeddingCreationAttributes, EmbeddingModel } from "../models/EmbeddingModel";

export class EmbeddingRepository {

    async bulkCreate(data: EmbeddingCreationAttributes[]) {
        return await EmbeddingModel.bulkCreate(
            data
        );

    }

}
