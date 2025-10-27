import { Response } from 'express';

export default class CustomResponse {
    response: Response;
    constructor(response: Response) {
        this.response = response;
    }

    private baseResponse(statusCode: number, message: string, data?: any) {
        return this.response.status(statusCode).json({
            status: statusCode >= 200 && statusCode < 300 ? true : false,
            statusCode: statusCode,
            message: message,
            data: data,
        });
    }

    public success(statusCode: number = 200, message: string = 'success', data?: any) {
        return this.baseResponse(statusCode, message, data);
    }

    public created(statusCode: number = 201, message: string = 'Resources Created', data?: any) {
        return this.baseResponse(statusCode, message, data);
    }

    public notFound(statusCode: number = 404, message: string = 'Not Found', data?: any) {
        return this.baseResponse(statusCode, message, data);
    }

    public badRequest(statusCode: number = 400, message: string = 'Bad Request', data?: any) {
        return this.baseResponse(statusCode, message, data);
    }
    public unauthorized(statusCode: number = 401, message: string = 'Unauthorized', data?: any) {
        return this.baseResponse(statusCode, message, data);
    }
    public forbidden(statusCode: number = 403, message: string = 'Forbidden', data?: any) {
        return this.baseResponse(statusCode, message, data);
    }
    public internalServerError(
        statusCode: number = 500,
        message: string = 'Internal Server Error',
        data?: any,
    ) {
        return this.baseResponse(statusCode, message, data);
    }
}
