// utils/JwtService.js
import jwt, { JsonWebTokenError, JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRATION, REFRESH_TOKEN_EXPIRATION } from 'config/env';
import { IUser } from 'models/User';
import { Service } from 'typedi';

@Service('jwtService')
export class JwtService {
    secret: string;
    expiresIn: number;
    refreshExpiresIn: number;

    constructor() {
        this.secret = JWT_SECRET;
        this.expiresIn = JWT_EXPIRATION;
        this.refreshExpiresIn = REFRESH_TOKEN_EXPIRATION;
    }

    public generateToken = async (
        payload: IUser,
        expiresIn: number = this.expiresIn,
    ): Promise<string> => {
        return jwt.sign(payload.toObject(), this.secret, {
            algorithm: 'HS256',
            subject: payload.email,
            expiresIn: expiresIn,
        });
    };

    public generateRefreshToken = async (payload: IUser): Promise<string> => {
        return await this.generateToken(payload, this.refreshExpiresIn);
    };

    public extractPayload = async (token: string): Promise<JwtPayload | string> => {
        return jwt.verify(token, this.secret);
    };

    public extractSubject = async (token: string): Promise<string> => {
        const data: JwtPayload | string = await this.extractPayload(token);

        if (typeof data === 'string' || !data.sub) {
            throw new JsonWebTokenError('Invalid token payload: no subject');
        }

        return data.sub;
    };

    public extractExpirationDate = async (token: string): Promise<Date> => {
        const data: JwtPayload | string = await this.extractPayload(token);

        if (typeof data === 'string' || !data.exp) {
            throw new JsonWebTokenError('Invalid token payload: no subject');
        }

        return new Date(data.exp * 1000);
    };

    public isTokenExpired = async (token: string): Promise<boolean> => {
        return (await this.extractExpirationDate(token)) < new Date();
    };

    public isTokenValid = async (token: string, user: IUser): Promise<boolean> => {
        const userEmail: string = await this.extractSubject(token);

        return userEmail === user.email && !(await this.isTokenExpired(token));
    };
}
