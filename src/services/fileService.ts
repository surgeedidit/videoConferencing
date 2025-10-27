import { GetFileByIdDTO, UploadFileDTO , GetFileByCloudIdDTO} from "@/dtos/fileUpload.dto";
import { FileRepository } from "@/repositories/fileRepository";
import { NotFoundError } from "@/utils/shared/customErrorClasses";
import { Inject, Service } from "typedi";
import { Request } from 'express';

@Service("fileService")
export class FileService {
    constructor(
        @Inject('fileRepository') private fileRepository : FileRepository
){

    }
    public uploadFileDetails(fileData : UploadFileDTO){
        return this.fileRepository.saveFile(fileData); 
    }

    public async getFileById(req : Request, getfileDTO: GetFileByIdDTO) {
        const file = await this.fileRepository.getFileById(getfileDTO.fileId);
        if(!file) throw new NotFoundError(req, "File not found!");

        return file;
    }

    public async getFileByCloudId(req : Request ,getFileDTO: GetFileByCloudIdDTO) {
        const file = await this.fileRepository.getFileByCloudId(getFileDTO.cloudId);
        if (!file) throw new NotFoundError(req, "File not Found!");

        return file
    }
}