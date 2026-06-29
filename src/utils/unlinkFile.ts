import { unlink } from "fs/promises";
import path from "path";

export const unlinkFile = async (storedName:string | undefined) =>{
    if(storedName){
        const filePath = path.join(process.cwd(), "uploads", storedName);

        await unlink(filePath);
    }
}