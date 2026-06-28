import { embeddingModelService } from "..";
import { Chunk } from "../interfaces/ChunkInterface";
import { EmbeddingRepository } from "../repository/embedding.repository";

export class EmbeddingService {
    private embeddingRepository = new EmbeddingRepository();
    async create(chunks:Chunk[], file_id:number){
        
        const rows = await Promise.all(
            chunks.map(async (chunk) => {

            
                const embedding = await embeddingModelService.embed(chunk.content ?? '');

                return {
                    file_id,
                    chunk_index:chunk.index,
                    fragment: chunk.content,
                    embedding

                };

            })
        )
        await this.embeddingRepository.bulkCreate(rows);
    }

    async getPerTenant(tenant_id:number, questionEmbedded:number[]){
        return this.embeddingRepository.getEmbeddingsPerClient(
            tenant_id,
            questionEmbedded,
        )
    }

}