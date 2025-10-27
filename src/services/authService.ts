import 'reflect-metadata';
import { Request, Response } from 'express';
import {
    CreateEmailDTO,
    LoginUserData,
    LoginUserDTO,
    CreateUserDTO,
    UserData,
    VerifyEmailDTO,
    ResetPasswordDto,
} from 'dtos/auth.dto';
import { UserRepository } from 'repositories/userRepository';
import { Inject, Service } from 'typedi';
import { IUser } from 'models/User';
import { BadRequestError } from 'utils/shared/customErrorClasses';
import { JwtService } from './jwtService';
import BCrypt from 'utils/bcrypt';
import { IAuthToken } from 'models/AuthToken';
import { AuthTokenRepository } from 'repositories/tokenRepository';
import { userSignedUpQueue, resetPasswordEmailQueue } from 'jobs/queue';
import { NODE_ENV, REFRESH_TOKEN_EXPIRATION } from '@/config/env';
import { LoggerService } from '@/config/winston.logger';

@Service('authService')
export class AuthService {
    constructor(
        @Inject('userRepository') private userRepository: UserRepository,
        @Inject('authTokenRepository') private authTokenRepository: AuthTokenRepository,
        @Inject('jwtService') private jwtService: JwtService,
        @Inject('bcrypt') private bycrypt: BCrypt,
        @Inject('logger') private logger: LoggerService
    ) {}

    async createUserEmail(request: Request, createEmailDto: CreateEmailDTO): Promise<string> {
        const user: IUser | null = await this.userRepository.findUserByEmail(createEmailDto.email);

        if (user) {
            throw new BadRequestError(
                request,
                `User with email ${createEmailDto.email} already exists.`,
            );
        }
        this.logger.info("Moving to repository layer!");
        const newUser: IUser = await this.userRepository.createUserBasic(createEmailDto);
        const token: IAuthToken = await this.authTokenRepository.createToken(newUser);

        this.logger.info('Adding request to userSignedUp Queue')
        await userSignedUpQueue.add('send-verification-email', { newUser, token });

        this.logger.info("All done, responding...");
        return `Please check your email ${createEmailDto.email} for the verification code`;
    }

    async verifyEmail(request: Request, verifyUserEmailDTO: VerifyEmailDTO): Promise<string> {
        const user: IUser | null = await this.userRepository.findUserByEmail(
            verifyUserEmailDTO.email,
        );

        if (!user) {
            throw new BadRequestError(
                request,
                `User with email ${verifyUserEmailDTO.email} does not exist!`,
            );
        }

        const token: IAuthToken | null = await this.authTokenRepository.findByToken(
            verifyUserEmailDTO.token,
        );

        if (!token || !(await this.authTokenRepository.validateToken(token, user)))
            throw new BadRequestError(request, 'Invalid token!');

        user.isActivated = true;
        await user.save();

        await this.authTokenRepository.invalidateToken(token.token);

        return 'User email verified successfully!';
    }

    async createUserAccount(request: Request, createUserDTO: CreateUserDTO): Promise<UserData> {
        const user: IUser | null = await this.userRepository.findUserByEmail(createUserDTO.email);

        if (!user)
            throw new BadRequestError(
                request,
                `User with email ${createUserDTO.email} does not exist.`,
            );

        if (!user.isActivated)
            throw new BadRequestError(request, 'Please verify your email before proceeding!');

        user.firstName = createUserDTO.firstName;
        user.lastName = createUserDTO.lastName;
        user.password = await this.bycrypt.generateHash(createUserDTO.password);
        await user.save();

        const userData: UserData = this.userRepository.getUserDetails(user);
        return userData;
    }

    async login(request: Request, response: Response, loginUserDto: LoginUserDTO): Promise<LoginUserData> {
        const user: IUser | null = await this.userRepository.findUserByEmail(loginUserDto.email);

        if (!user)
            throw new BadRequestError(
                request,
                `User with email ${loginUserDto.email} does not exist.`,
            );

        if (!(await this.userRepository.verifyUserPassword(loginUserDto)))
            throw new BadRequestError(request, 'Invalid Password or Email, please try again!');

        const refreshToken = await this.jwtService.generateRefreshToken(user);
        response.cookie('jwt', refreshToken, {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: REFRESH_TOKEN_EXPIRATION * 1000 //in milliseconds
        });

        return {
            token: await this.jwtService.generateToken(user),
            userData: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            },
        };
    }

    async initiatePasswordReset(request: Request, email: string): Promise<string> {
        const user: IUser | null = await this.userRepository.findUserByEmail(email);

        if (!user) throw new BadRequestError(request, `User with email ${email} does not exist!`);

        const token: IAuthToken = await this.authTokenRepository.createToken(user);
        
        await resetPasswordEmailQueue.add('initiatePasswordReset', { user, token });
        return 'Password reset email sent successfully!';
    }

    async verifyPasswordResetToken(
        request: Request,
        verifyPasswordResetDTO: VerifyEmailDTO,
    ): Promise<string> {
        const user: IUser | null = await this.userRepository.findUserByEmail(
            verifyPasswordResetDTO.email,
        );
        if (!user) {
            throw new BadRequestError(
                request,
                `User with email ${verifyPasswordResetDTO.email} does not exist!`,
            );
        }

        const token: IAuthToken | null = await this.authTokenRepository.findByToken(
            verifyPasswordResetDTO.token,
        );
        if (!token || !(await this.authTokenRepository.validateToken(token, user)))
            throw new BadRequestError(request, 'Invalid token!');
        await this.authTokenRepository.invalidateToken(token.token);
        return 'Token verified successfully!';
    }

    async resetPassword(request: Request, resetPasswordDTO: ResetPasswordDto): Promise<string> {
        const user: IUser | null = await this.userRepository.findUserByEmail(
            resetPasswordDTO.email,
        );
        if (!user) {
            throw new BadRequestError(
                request,
                `User with email ${resetPasswordDTO.email} does not exist!`,
            );
        }

        if (resetPasswordDTO.password != resetPasswordDTO.rePassword)
            throw new BadRequestError(request, `Password and rePassword must match!`);

        user.password = await this.bycrypt.generateHash(resetPasswordDTO.password);
        await user.save();

        return 'Password updated successfully!';
    }
}
