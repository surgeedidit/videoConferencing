import { Request } from 'express';

export class CustomError extends Error {
    statusCode: number;
    details?: any;
    request?: Request;

    constructor(request: Request, statusCode: number, message: string, details?: any) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.name = this.constructor.name;
        this.request = request;
        Error.captureStackTrace(this, this.constructor);
    }
    public errorToJson() {
        return {
            name: this.name,
            message: this.message,
            statusCode: this.statusCode,
            path: this.request?.path,
            method: this.request?.method,
            ...(this.details && { details: this.details }),
        };
    }
}

export class NotFoundError extends CustomError {
    constructor(request: Request, message: string = 'Not Found') {
        super(request, 404, message);
    }
}

export class RouteNotFoundError extends NotFoundError {
    constructor(request: Request, message: string = 'Route Not Found') {
        super(request, message);
    }
}

export class UserNotFoundError extends NotFoundError {
    constructor(request: Request, message: string = 'User Not Found') {
        super(request, message);
    }
}

export class MeetingNotFoundError extends NotFoundError {
    constructor(request: Request, message: string = 'Meeting Not Found') {
        super(request, message);
    }
}

export class UnauthorizedError extends CustomError {
    constructor(request: Request, message: string = 'Unauthorized') {
        super(request, 401, message);
    }
}

export class BadRequestError extends CustomError {
    constructor(request: Request, message: string = 'Bad Request') {
        super(request, 400, message);
    }
}
