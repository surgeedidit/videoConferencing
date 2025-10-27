import { Inject, Service } from 'typedi';
import { transporter } from 'config/emailConfig';
import { LoggerService } from 'config/winston.logger';
import { GMAIL_USERNAME } from '@/config/env';

// @Service('emailService')
export default class EmailService {
    constructor(@Inject('logger') private logger: LoggerService) {}

    async sendVerificationEmail(recipientEmail: string, verificationCode: string) {
        try {
            return await transporter.sendMail({
                from: GMAIL_USERNAME, // `video conferencing oau` using the former for temporary fix
                to: recipientEmail,
                subject: 'Email Verification requested!',
                template: 'verify-email',
                context: {
                    recipientEmail,
                    verificationCode,
                    subject: 'Verify Your Email',
                    year: new Date().getFullYear(),
                },
            } as any);
        } catch (error) {
            this.logger.error(`Error sending verification email: ${error}`);
            throw error;
        }
    }

    async sendPasswordResetInitiationEmail(recipientEmail: string, verificationCode: string) {
        try {
            return await transporter.sendMail({
                from: GMAIL_USERNAME, // `video conferencing oau`
                to: recipientEmail,
                subject: 'Reset Password!',
                template: 'password-reset',
                context: {
                    recipientEmail,
                    verificationCode,
                    subject: 'Reset Password',
                    year: new Date().getFullYear(),
                },
            } as any);
        } catch (error) {
            this.logger.error(`Error sending reset password Email: ${error}`);
            throw error;
        }
    }
}
