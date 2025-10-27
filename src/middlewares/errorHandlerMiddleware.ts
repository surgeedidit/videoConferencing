import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { CustomError } from '../utils/shared/customErrorClasses';
import { Container } from 'typedi';
import CustomResponse from '../utils/shared/CustomResponse';
import { LoggerService } from 'config/winston.logger';
import { JsonWebTokenError } from 'jsonwebtoken';

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    const logger: LoggerService = Container.get('logger');
    const customResponse: CustomResponse = new CustomResponse(res);

    let errorDetails: any = {};

    if (error instanceof CustomError) {
        errorDetails = error.errorToJson();
    } else if (error instanceof JsonWebTokenError) {
        errorDetails = {
            name: error.name || 'jsonWebTokenError',
            message: error.message || 'Error parsing token',
            stack: error.stack,
            path: req?.path,
            statusCode: 400,
        };
    } else if (error instanceof ZodError) {
        errorDetails = {
            name: 'ValidationError',
            message: 'Input validation failed',
            issues: error.issues,
            path: req?.path,
            method: req?.method,
            statusCode: 400,
        };
    } else {
        errorDetails = {
            name: error?.name,
            message: error?.message,
            stack: error?.stack,
            path: req?.path,
            method: req?.method,
            statusCode: 500,
        };
    }

    logger.error(`Error details: ${JSON.stringify(errorDetails, null, 2)}`);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
        customResponse.badRequest(400, errorDetails.message, errorDetails);
        return;
    }
    //Handle JsonWebTokenError
    if (error instanceof JsonWebTokenError) {
        customResponse.badRequest(400, errorDetails.message, errorDetails);
    }

    // Handle known custom errors
    if (error instanceof CustomError) {
        switch (error.statusCode) {
            case 400:
                customResponse.badRequest(error.statusCode, errorDetails.message, errorDetails);
                break;
            case 401:
                customResponse.unauthorized(error.statusCode, errorDetails.message, errorDetails);
                break;
            case 403:
                customResponse.forbidden(error.statusCode, errorDetails.message, errorDetails);
                break;
            case 404:
                customResponse.notFound(error.statusCode, errorDetails.message, errorDetails);
                break;
            default:
                customResponse.internalServerError(
                    error.statusCode,
                    errorDetails.message,
                    errorDetails,
                );
        }
        return;
    }

    // Fallback for unknown/unexpected errors
    res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
        path: req?.path,
        method: req?.method,
    });
};
