import mongoose from 'mongoose';
import { DB_URL as dbUrl, DB_NAME as dbName } from './env';
import { LoggerService } from './winston.logger';

export default async (logger: LoggerService): Promise<mongoose.Mongoose> => {
    try {
       return await mongoose.connect(`${dbUrl}/${dbName}`, {
          authSource: 'admin',
          writeConcern: {
            w: 1
          }
    });
    } catch (error) {
        logger.error(`Database failed to connect: ${error}`);
        throw error;
    }
};
