import { Strategy as GoogleStrategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import passport from 'passport';
import { User, IUser, AccountType } from '../models/User';
import Container from 'typedi';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } from '../config/env'; 
import { IAuthToken } from '@/models/AuthToken';
import { AuthTokenRepository } from '@/repositories/tokenRepository';
import { LoggerService } from '@/config/winston.logger';

passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID,
            clientSecret: GOOGLE_CLIENT_SECRET,
            callbackURL: GOOGLE_REDIRECT_URI
        },
        async (
            accessToken: string,
            refreshToken: string,
            profile: Profile,
            done: VerifyCallback,
        ) => {
            const logger: LoggerService = Container.get('logger');
            const tokenRepository: AuthTokenRepository = Container.get('authTokenRepository');
            try {
                if (!profile.emails || !profile.emails.length || !profile.emails[0].value) {
                    // If no email is found, return an error
                    return done(new Error('No email found in Google profile'), false);
                } else {
                    const userExistence = await User.findOne({
                        email: profile.emails[0].value,
                    });
                    if (!userExistence) {
                        const newUser: IUser = new User({
                            email: profile.emails[0].value,
                            firstName: profile.name?.givenName,
                            lastName: profile.name?.familyName,
                            isActivated: true,
                            profileImageString: profile.photos ? profile.photos[0].value : '',
                            accountType: AccountType.GOOGLE,
                        });
                        await newUser.save();
                        const authToken: IAuthToken = await tokenRepository.createToken(newUser);
                        logger.info('User has been successfully added to database');
                        return done(null, authToken);
                    } else {
                        // User already exists
                        const authToken: IAuthToken | null = await tokenRepository.refreshToken(userExistence)
                        if (!authToken) {
                            const newToken: IAuthToken = await tokenRepository.createToken(userExistence);
                            return done(null, newToken);
                        }
                        return done(null, authToken);
                    }
                }
            } catch (error) {
                logger.error(`Error occurred while retrieving user data from google: ${error}`);
                return done(error, false);
            }
        },
    ),
)