import { createLogger, format, transports, Logger } from 'winston';
import { Service } from 'typedi';

@Service('logger')
export class LoggerService {
    private logger: Logger;

    constructor() {
        const customTransports = [];

        if (process.env.NODE_ENV !== 'production') {
            customTransports.push(
                new transports.Console({
                    format: format.combine(
                        format.colorize(),
                        format.timestamp(),
                        format.printf(({ timestamp, level, message }) => {
                            return `${timestamp} ${level}: ${message}`;
                        }),
                    ),
                }),
            );
        } else {
            customTransports.push(
                new transports.File({
                    level: 'error',
                    filename: 'error.log',
                    format: format.combine(format.timestamp(), format.json()),
                }),
            );

            customTransports.push(
                new transports.File({
                    level: 'info',
                    filename: 'application.log',
                    format: format.combine(format.timestamp(), format.json()),
                }),
            );
        }

        this.logger = createLogger({
            level: 'info',
            transports: customTransports,
        });
    }

    info(message: string): void {
        this.logger.info(message);
    }

    error(message: string): void {
        this.logger.error(message);
    }

    warn(message: string): void {
        this.logger.warn(message);
    }
}
