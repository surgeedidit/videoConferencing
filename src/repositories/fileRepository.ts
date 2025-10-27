import { LoggerService } from "@/config/winston.logger";
import { UploadFileDTO } from "@/dtos/fileUpload.dto";
import { File, IFile } from "@/models/FileUpload";
import { Inject, Service } from "typedi";

@Service("fileRepository")
export class FileRepository {
    constructor(@Inject('logger') private logger : LoggerService) {

    }

    async saveFile(fileData : UploadFileDTO) : Promise<IFile> {
        try {
            this.logger.info(`Attempting to save file with cloud id: ${fileData.cloudId}`);
            return await File.create({...fileData});
            
        } catch (error) {
            this.logger.error(`error saving file ${fileData.cloudId}: ${error}`);
            throw error;
        }
    }

    async getFileById(fileId : string) : Promise<IFile | null> {
        try {
            return await File.findById({id: fileId})
            
        } catch (error) {
            this.logger.error(`Error retrieving file with id: ${fileId}`)
            throw error;
        }
    
    }

    async getFileByCloudId(cloudId : string) : Promise<IFile | null> {
        try {
            return await File.findById({ cloudId})
            
        } catch (error) {
            this.logger.error(`Error retrieving file with id: ${cloudId}`)
            throw error;
        }
    }
}