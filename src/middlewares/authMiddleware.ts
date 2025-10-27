import 'reflect-metadata';
import { UserRepository } from 'repositories/userRepository';
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, NotFoundError, UserNotFoundError } from 'utils/shared/customErrorClasses';
import { JwtService } from 'services/jwtService';
import { Service, Inject } from 'typedi';
import { tokenExtractor } from 'utils/tokenExtractor';
import CustomResponse from 'utils/shared/CustomResponse';
import { CreateEmailDTO, CreateEmailSchema } from 'dtos/auth.dto';
import { JWT_EXPIRATION } from 'config/env';

@Service()
export class AuthMiddleware {

    constructor(
        @Inject('jwtService') private jwtService: JwtService,
        @Inject('userRepository') private userRepository: UserRepository
    ) {}

    public refreshToken = async (request: Request, response: Response, next: NextFunction): Promise<any> => {
        const customResponse = new CustomResponse(response);

        try {
            const validatedData: CreateEmailDTO = CreateEmailSchema.parse(request.body);
            const refreshToken: string = request.cookies.jwt;
            if (!refreshToken) {
                throw new UnauthorizedError(
                    request,
                    'No refresh token found'
                )
            }

            const refreshTokenValidity = await this.jwtService.isTokenExpired(refreshToken);
            if (refreshTokenValidity) {
                customResponse.forbidden(403, 'RefreshToken expired, return to login page');
            } else {
                const user = await this.userRepository.findUserByEmail(validatedData.email);
                if (!user) {
                    throw new UserNotFoundError(
                        request,
                        'User not found in database'
                    )
                }

                customResponse.created(201, 'Access token generated', {
                    token: await this.jwtService.generateToken(user, JWT_EXPIRATION)
                })
            }
        } catch (error) {
            return next(error);
        }
    }

    public checkAccessToken = async (request: Request, response: Response, next: NextFunction): Promise<any> => {
        const customResponse = new CustomResponse(response);
        try {
            if (!request.headers.authorization || !request.headers.authorization.startsWith('Bearer ')) {
                throw new UnauthorizedError(
                    request,
                    "Not authorized"
                )
            }

            const token: string = tokenExtractor(request.headers.authorization);
            if (!token) {
                throw new NotFoundError(
                    request,
                    "Token not found"
                )
            }

            const tokenValidity = await this.jwtService.isTokenExpired(token);
            if (tokenValidity) {
                
                customResponse.unauthorized(401, `Unauthorized access to path: ${request.path}. Use refresh token.`);
                return; 
            }

           
            const payload = await this.jwtService.extractPayload(token);
            (request as any).user = payload; // Cast as IUser if you extend Request interface later

            return next();
        } catch (error) {
            return next(error);
        }
    }
}