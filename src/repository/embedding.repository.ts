import { QueryTypes } from "sequelize";
import { sequelize } from "../db";
import { EmbeddingAttributes, EmbeddingCreationAttributes, EmbeddingModel } from "../models/EmbeddingModel";
import { FileModel } from "../models/FileModel";

export class EmbeddingRepository {

    async bulkCreate(data: EmbeddingCreationAttributes[]) {
        return await EmbeddingModel.bulkCreate(
            data
        );
    }

    async getEmbeddingsPerClient(tenant_id:number, queryEmbedded:number[], limit = 5){
        const results:EmbeddingAttributes[] = await sequelize.query(
            `SELECT 
                e.fragment,
                e.embedding <=> CAST(:embedding AS vector) AS distance
            FROM embeddings e
            INNER JOIN 
                files f ON e.file_id = f.id
            WHERE f.tenant_id = :tenantId
            ORDER BY e.embedding <=> CAST(:embedding AS vector)
            LIMIT :limit`,
            {
            replacements: { embedding: `[${queryEmbedded.join(',')}]`, tenantId: tenant_id, limit}, 
            type: QueryTypes.SELECT
            }
        );
        return results
    }

}
