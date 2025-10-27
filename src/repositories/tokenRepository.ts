import { Service, Inject } from 'typedi';
import { LoggerService } from 'config/winston.logger';
import { AuthToken, IAuthToken } from 'models/AuthToken';
import { Types } from 'mongoose';
import { IUser } from 'models/User';
import { generateVerificationCode } from 'utils/codeGenerator';

@Service('authTokenRepository')
export class AuthTokenRepository {
    constructor(@Inject('logger') private logger: LoggerService) {}

    async findTokenByUserId(userId: Types.ObjectId): Promise<IAuthToken | null> {
        try {
            const token: IAuthToken | null = await AuthToken.findOne({ userId });
            return token;
        } catch (error) {
            this.logger.error(`Error finding token by user ID: ${error}`);
            throw error;
        }
    }

    async findByToken(token: string): Promise<IAuthToken | null> {
        try {
            return AuthToken.findOne({ token, isValid: true });
        } catch (error) {
            this.logger.error(`Error finding token by user ID: ${error}`);
            throw error;
        }
    }

    async createToken(user: IUser): Promise<IAuthToken> {
        try {
            return AuthToken.create({
                userId: user.id,
                token: generateVerificationCode(6),
                expiresAt: new Date(Date.now() + 60 * 60 * 1000),
                isValid: true,
            });
        } catch (error) {
            this.logger.error(`Error signing token: ${error}`);
            throw error;
        }
    }

    async invalidateToken(token: string): Promise<void> {
        try {
            await AuthToken.updateOne({ token }, { isValid: false });
        } catch (error) {
            this.logger.error(`Something went wrong whilst invalidating token: ${error}`);
            throw error;
        }
    }

    async validateToken(token: IAuthToken, user: IUser): Promise<boolean> {
        try {
            if (user.id != token.userId) return false;
            if (!token.isValid || token.expiresAt < new Date()) return false;

            return true;
        } catch (error) {
            this.logger.error(`Something went wrong whilst validating token: ${error}`);
            throw error;
        }
    }

    async refreshToken(user: IUser): Promise<IAuthToken | null> {
        try{
            const authToken = await this.findTokenByUserId(user.id);
            if(!authToken)
                return null;

            const newToken = await AuthToken.findOneAndUpdate({userId: authToken.userId}, {$set: {token: generateVerificationCode()}}, { new: true});
            if(! newToken)
                throw new Error('Error occurred in replacing token');

            return newToken;
        }catch (error){
            this.logger.error(`Something went wrong whilst refreshing token: ${error}`)
            throw error
        }
    }
}
