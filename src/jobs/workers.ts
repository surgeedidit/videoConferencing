import { Worker } from 'bullmq';
import { redisInstance } from '../config/redisConnection';
import { LoggerService } from '../config/winston.logger';
import EmailService from '../services/emailService';

const logger = new LoggerService();
const emailService = new EmailService(logger);

// BullMQ worker options
const workerOptions = {
  connection: redisInstance,
  concurrency: 3,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 100 }
};

// Worker for user sign-up emails
const userSignedUpWorker = new Worker(
  'userSignedUp',
  async job => {
    try {
      const { newUser, token } = job.data;
      if (!newUser?.email || !token?.token) {
        throw new Error('Missing email or token');
      }
      logger.info(`Sending verification email to ${newUser.email}`);
      await emailService.sendVerificationEmail(newUser.email, token.token);
      logger.info(`Verification email sent to ${newUser.email}`);
    } catch (error) {
      logger.error(`Failed to send verification email: ${error}`);
      throw error;
    }
  },
  workerOptions
);

// Worker for password reset emails
const resetPasswordWorker = new Worker(
  'forgotPassword',
  async job => {
    try {
      const { user, token } = job.data;
      if (!user?.email || !token?.token) {
        throw new Error('Missing email or token');
      }
      logger.info(`Sending password reset email to ${user.email}`);
      await emailService.sendPasswordResetInitiationEmail(user.email, token.token);
      logger.info(`Password reset email sent to ${user.email}`);
    } catch (error) {
      logger.error(`Failed to send password reset email: ${error}`);
      throw error;
    }
  },
  workerOptions
);


userSignedUpWorker.on('failed', (job, err) => {
  logger.error(`userSignedUp job failed: ${err.message}`);
});

resetPasswordWorker.on('failed', (job, err) => {
  logger.error(`forgotPassword job failed: ${err.message}`);
});

const shutdown = async () => {
  await userSignedUpWorker.close();
  await resetPasswordWorker.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { userSignedUpWorker, resetPasswordWorker };