import 'reflect-metadata';
import { LoggerService } from './config/winston.logger';
import app from './app';
import { loadDependencies } from './config/dependencyInjection';
import dbConnection from './config/databaseConfig';
import mongoose from 'mongoose';
import { PORT } from './config/env';
import { Container } from 'typedi';
import { transporter } from 'config/emailConfig';
import { createServer } from 'http';
import { createSocketServer } from '@config/socketConfig';

let connection: mongoose.Mongoose;
const logger = Container.get<LoggerService>('logger');

async function startServer(): Promise<void> {
    try {
        await loadDependencies();
        logger.info('Dependencies loaded successfully.');

        connection = await dbConnection(logger);
        logger.info('Database connected successfully.');

        if (await transporter.verify()) {
            logger.info('Email transporter successfully initialized!');
        } else {
            logger.info('Email Transporter failed initialization failed!');
            process.exit(1);
        }

        const httpServer = createServer(app);
        createSocketServer(httpServer);
        logger.info('Socket.IO server is ready for connections');
        const HOST = '0.0.0.0';
        httpServer.listen(PORT, HOST,() => {
            logger.info(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        logger.error(`Error during startup: ${error}`);
        process.exit(1);
    }
}

startServer();

process.on('SIGINT', async () => {
    logger.info('SIGINT received. Closing MongoDB connection.');
    await mongoose.connection.close();
    logger.info('MongoDB connection closed. Exiting process.');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Closing MongoDB connection.');
    await mongoose.connection.close();
    logger.info('MongoDB connection closed. Exiting process.');
    process.exit(0);
});

function hasErrorCode(e: unknown): e is NodeJS.ErrnoException {
    return typeof e === 'object' && e !== null && 'code' in e;
}

process.on('uncaughtException', (err: unknown) => {
    if (hasErrorCode(err) && err.code === 'ECONNRESET') {
        logger.warn('ECONNRESET occurred, ignoring...');
    } else {
        logger.error(`Unhandled exception: ${err}`);
    }
});
