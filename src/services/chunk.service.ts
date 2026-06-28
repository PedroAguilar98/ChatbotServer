import { Chunk } from "../interfaces/ChunkInterface";

export class ChunkService {

    split(
        text: string,
        chunkSize = 2000,
        overlap = 200
    ): Chunk[] {

        const chunks: Chunk[] = [];

        let start = 0;
        let index = 0

        while (start < text.length) {

            const end = Math.min(
                start + chunkSize,
                text.length
            );

            chunks.push({content:text.substring(start, end), index});
            index ++

            start += chunkSize - overlap;
        }

        return chunks;

    }

}