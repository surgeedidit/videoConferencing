import {z} from 'zod';

export const UploadFileSchema = z.object({
    cloudId: z.string(),
    url: z.string(),
    sizeInBytes: z.number(),
    folder: z.string(),
    originalName: z.string()

})
export type UploadFileDTO = z.infer<typeof UploadFileSchema>

export const GetFileByIdSchema = z.object({
    fileId: z.string()
})
export type GetFileByIdDTO = z.infer<typeof GetFileByIdSchema>

export const GetFileByCloudIdSchema = z.object({
    cloudId: z.string()
})
export type GetFileByCloudIdDTO = z.infer<typeof GetFileByCloudIdSchema>