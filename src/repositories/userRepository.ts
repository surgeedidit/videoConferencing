import { CreateEmailDTO, LoginUserDTO, UpdateNameDTO, UserData } from 'dtos/auth.dto';
import mongoose from 'mongoose';
import { User, IUser } from 'models/User';
import { Service, Inject } from 'typedi';
import { LoggerService } from 'config/winston.logger';
import BCrypt from 'utils/bcrypt';

@Service('userRepository')
export class UserRepository {
    constructor(
        @Inject('logger') private logger: LoggerService,
        @Inject('bcrypt') private bcrypt: BCrypt,
    ) {}

    async findUserByEmail(email: string): Promise<IUser | null> {
        try {
            const user: IUser | null = await User.findOne({ email });
            return user;
        } catch (error) {
            this.logger.error(`Error fetching user from database : ${error}`);
            throw error;
        }
    }

    async findById(id: string | mongoose.Types.ObjectId): Promise<IUser | null> {
        try {
            return await User.findById(id);
        } catch (error) {
            this.logger.error(`Error finding user by ID: ${error}`);
            throw error;
        }
    }

    async createUserBasic(createEmailDto: CreateEmailDTO): Promise<IUser> {
        try {
            this.logger.info('Repository: CreateUserBasic');
            const user: IUser = await User.create({ email: createEmailDto.email });
            this.logger.info('Created user successfully!');
            return user;
        } catch (error) {
            this.logger.error(`Error creating user: ${error}`);
            throw error;
        }
    }

    async updateUserName(updateUserName: UpdateNameDTO): Promise<IUser | null> {
        try {
            const user: IUser | null = await this.findUserByEmail(updateUserName.email);

            if (!user) throw new Error('User not found');

            user.firstName = updateUserName.firstName;
            user.lastName = updateUserName.lastName;
            user.save();

            return user;
        } catch (error) {
            this.logger.error(`Something went wrong whilst updating name: ${error}`);
            throw error;
        }
    }

    async verifyUserPassword(loginRequestDTO: LoginUserDTO): Promise<boolean> {
        try {
            const user: IUser | null = await this.findUserByEmail(loginRequestDTO.email);

            if (!user) {
                throw new Error('User not found');
            }

            if (!user.password) {
                return false;
            }

            const status: boolean = await this.bcrypt.verifyPassword(
                loginRequestDTO.password,
                user.password,
            );
            this.logger.info(`status: ${status}`);
            return status;
        } catch (error) {
            this.logger.error(`Password verification failed: ${error}`);
            throw error;
        }
    }

    getUserDetails(user: IUser): UserData {
        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
        };
    }
}
