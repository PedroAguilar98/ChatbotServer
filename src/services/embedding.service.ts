import { embeddingModelService } from "..";
import { Chunk } from "../interfaces/ChunkInterface";
import { EmbeddingRepository } from "../repository/embedding.repository";

export class EmbeddingService {

    async create(chunks:Chunk[], file_id:number){
        const embeddingRepository = new EmbeddingRepository()
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
        await embeddingRepository.bulkCreate(rows);
    }

}