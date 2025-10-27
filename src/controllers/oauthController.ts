import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';
import { Service, Inject } from 'typedi';
import { Logger } from 'winston';
import { JwtService } from 'services/jwtService';
import { UserNotFoundError } from 'utils/shared/customErrorClasses';
import { NODE_ENV, REFRESH_TOKEN_EXPIRATION } from '@/config/env';
import CustomResponse from '@/utils/shared/CustomResponse';
import { IAuthToken } from '@/models/AuthToken';
import { UserRepository } from '@/repositories/userRepository';
import { AuthTokenRepository } from '@/repositories/tokenRepository';
import { BasicAuthTokenDTO, BasicAuthTokenSchema } from '@/dtos/auth.dto';
import { FRONTEND_BASE_URI } from '@/config/env';

@Service()
export class OauthController {
    constructor(
        @Inject('logger') private logger: Logger,
        @Inject('jwtService') private jwtService: JwtService,
        @Inject('userRepository') private userRepository: UserRepository,
        @Inject('authTokenRepository') private tokenRepository: AuthTokenRepository
    ) {}

    public redirectSuccess = async (request: Request, response: Response, next: NextFunction): Promise<any> => {
        try {
            if(!request.user){
                throw new UserNotFoundError(
                    request,
                    'User data not received'
                )
            }
            const authToken = (request.user as IAuthToken).token;
            return response.redirect(`${FRONTEND_BASE_URI}/auth/google/callback?code=${authToken}`);
        } catch (error) {
            next(error);
        }
    };

    public fetchUserData = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        const customResponse = new CustomResponse(res);
        try{
            const validatedData: BasicAuthTokenDTO = BasicAuthTokenSchema.parse(req.body);
            if(!validatedData){
                throw new UserNotFoundError(
                    req,
                    'Auth token not found'
                )
            }
            const userAuthToken = await this.tokenRepository.findByToken(validatedData.authToken);
            if( !userAuthToken){
                throw new UserNotFoundError(
                    req,
                    'User not found from auth token'
                )
            }
            const userData = await this.userRepository.findById(userAuthToken.userId);
            if( !userData){
                throw new UserNotFoundError(
                    req,
                    'User not found'
                )
            }
            const refreshToken = await this.jwtService.generateRefreshToken(userData);
            const token = await this.jwtService.generateToken(userData);
            res.cookie('jwt', refreshToken, {
                        httpOnly: true,
                        secure: NODE_ENV === 'production',
                        sameSite: 'none',
                        maxAge: REFRESH_TOKEN_EXPIRATION * 1000 //in milliseconds
            });

            return customResponse.success(200, 'User data fetched successfully', {
                accessToken: token,
                userData: {
                    id: userData.id,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    email: userData.email,
                }
            })
        }catch(error){
            next(error);
        }
    }
}
