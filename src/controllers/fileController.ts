import { Request, Response, NextFunction } from 'express';

import { LoggerService } from "@/config/winston.logger";
import { FileService } from "@/services/fileService";
import { Inject , Service} from "typedi";
import CustomResponse from '@utils/shared/CustomResponse';
import { GetFileByCloudIdSchema, GetFileByIdSchema, UploadFileSchema } from '@/dtos/fileUpload.dto';
import { BadRequestError } from '@/utils/shared/customErrorClasses';


@Service('fileController')
export class FileController{
    constructor(@Inject('logger') private logger : LoggerService,
                @Inject('fileService') private fileService : FileService
            ) {}

    public saveFile = async (req : Request, res: Response, next : NextFunction) : Promise<any>=> {
        const customResponse: CustomResponse = new CustomResponse(res);
        try {
            this.logger.info(
                `request path: ${req.path} hit!`,
            );
            const fileData = UploadFileSchema.parse(req.body);
            const fileDetails = await this.fileService.uploadFileDetails(fileData)
            return customResponse.success(200, 'File Uploaded sucessfully', fileDetails)
        } catch (error) {
            this.logger.error(`Error in the saveFile controller: ${error}`)
            next(error)
        }
    }

    public getFileByRequestParam = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        const customResponse: CustomResponse = new CustomResponse(res);
        try {
            this.logger.info(`request path: ${req.path} hit!`);

            const { fileId, cloudId } = req.params;

            if (fileId && cloudId) {
                throw new BadRequestError(req, "Invalid URL: provide either fileId or cloudId, not both.");
            }

            if (fileId) {
                const data = await this.fileService.getFileById(req, GetFileByIdSchema.parse(fileId));
                return customResponse.success(200, "File retrieved successfully", data);
            }

            if (cloudId) {
                const data = await this.fileService.getFileByCloudId(req, GetFileByCloudIdSchema.parse(cloudId));
                return customResponse.success(200, "File retrieved successfully", data);
            }

            throw new BadRequestError(req, "Either fileId or cloudId must be provided!");
        } catch (error) {
            this.logger.error(`Error in the get file controller: ${error}`);
            next(error);
        }
    }

}