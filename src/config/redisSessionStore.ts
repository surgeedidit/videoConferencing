// config/redisSessionStore.ts
import { RedisStore } from 'connect-redis';
import { Container } from 'typedi';
import { LoggerService } from './winston.logger';
import { redisInstance } from './redisConnection';

const logger: LoggerService = Container.get<LoggerService>('logger');

const redisStore = new RedisStore({
  client: redisInstance as any,
  prefix: 'video-conferencing:',
});

export default redisStore;