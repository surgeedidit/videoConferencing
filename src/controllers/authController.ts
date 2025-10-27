import { Service, Inject } from 'typedi';
import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { AuthService } from 'services/authService';
import CustomResponse from 'utils/shared/CustomResponse';
import {
    CreateEmailDTO,
    CreateEmailSchema,
    CreateUserDTO,
    CreateUserSchema,
    LoginUserDTO,
    LoginUserSchema,
    ResetPasswordDto,
    ResetPasswordSchema,
    UserData,
    VerifyEmailDTO,
    VerifyEmailSchema,
} from 'dtos/auth.dto';
import { BadRequestError } from 'utils/shared/customErrorClasses';

@Service()
export class AuthController {
    constructor(
        @Inject('authService') private authService: AuthService,
        @Inject('logger') private logger: Logger,
    ) {}

    public login = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        const customResponse: CustomResponse = new CustomResponse(res);
        try {
            this.logger.info(
                `request path: ${req.path} hit!`,
            );
            const validatedData: LoginUserDTO = LoginUserSchema.parse(req.body);
            const data = await this.authService.login(req,res, validatedData);
            return customResponse.success(200, 'Login successful', data);
        } catch (error) {
            next(error);
        }
    };

    public register = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        const customResponse: CustomResponse = new CustomResponse(res);
        try {
            this.logger.info(
                `request path: ${req.path} hit!`,
            );
            const validatedData: CreateEmailDTO = CreateEmailSchema.parse(req.body);
            const message: string = await this.authService.createUserEmail(req, validatedData);
            return customResponse.success(200, message || 'Registration successful');
        } catch (error) {
            next(error);
        }
    };

    public verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        const customResponse: CustomResponse = new CustomResponse(res);
        try {
            this.logger.info(
                `request path: ${req.path} hit!`,
            );
            const validatedData: VerifyEmailDTO = VerifyEmailSchema.parse(req.body);
            const data: string = await this.authService.verifyEmail(req, validatedData);
            return customResponse.success(200, data);
        } catch (error) {
            next(error);
        }
    };

    public createAccount = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<any> => {
        const customResponse: CustomResponse = new CustomResponse(res);
        try {
            this.logger.info(
                `request path: ${req.path} hit!`,
            );
            const validatedData: CreateUserDTO = CreateUserSchema.parse(req.body);
            const data: UserData = await this.authService.createUserAccount(req, validatedData);
            return customResponse.success(200, 'User account Created Successfully!', data);
        } catch (error) {
            next(error);
        }
    };

    public initiatePasswordReset = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<any> => {
        const customResponse: CustomResponse = new CustomResponse(res);
        try {
            this.logger.info(
                `request path: ${req.path} hit!`,
            );
            const userEmail: string = req.body?.email;

            if (!userEmail) {
                throw new BadRequestError(req, `Email field is required`);
            }

            const message: string = await this.authService.initiatePasswordReset(req, userEmail);
            return customResponse.success(200, message);
        } catch (error) {
            next(error);
        }
    };

    public verifyPasswordResetToken = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<any> => {
        const customResponse: CustomResponse = new CustomResponse(res);
        try {
            this.logger.info(
                `request path: ${req.path} hit!`,
            );
            const validatedData: VerifyEmailDTO = VerifyEmailSchema.parse(req.body);
            const message: string = await this.authService.verifyPasswordResetToken(
                req,
                validatedData,
            );

            return customResponse.success(200, message);
        } catch (error) {
            next(error);
        }
    };

    public resetPassword = async (
        req: Request,
        res: Response,
        next: NextFunction,
    ): Promise<any> => {
        const customResponse: CustomResponse = new CustomResponse(res);
        try {
            this.logger.info(
                `request path: ${req.path} hit!`,
            );
            const validatedData: ResetPasswordDto = ResetPasswordSchema.parse(req.body);
            const message: string = await this.authService.resetPassword(req, validatedData);

            return customResponse.success(200, message);
        } catch (error) {
            next(error);
        }
    };
}
