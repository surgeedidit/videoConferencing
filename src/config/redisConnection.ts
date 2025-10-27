import Redis from 'ioredis';
import { REDIS_URL, REDIS_TLS } from "./env";
import { LoggerService } from './winston.logger';

const logger = new LoggerService();

export function getNewRedisInstance(): Redis {
  const redisOptions: any = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false,
    connectTimeout: 10000,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  };

  if (REDIS_TLS === 'true') {
    redisOptions.tls = {
      rejectUnauthorized: false
    };
  }

  const redis = new Redis(REDIS_URL, redisOptions);

  redis.on('error', (err: Error) => {
    logger.error(`Redis connection error: ${err.message}`);
  });

  redis.on('connect', () => {
    logger.info('Redis connected successfully');
  });

  redis.on('ready', () => {
    logger.info('Redis is ready to accept commands');
  });

  return redis;
}

export const redisInstance = getNewRedisInstance();