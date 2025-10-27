import express from 'express';
import passport from 'passport';
import Container from 'typedi';
import { OauthController } from '../../../controllers/oauthController';

const googleOauthRouter = express.Router();
const oauthController = Container.get(OauthController);

googleOauthRouter.get(
    '/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false, prompt: "select_account" })
);

googleOauthRouter.get(
    '/google/redirect',
    passport.authenticate('google', {session: false, failureRedirect: '/login' }),
    oauthController.redirectSuccess,
);

googleOauthRouter.post(
    '/google/userdata',
    oauthController.fetchUserData
);

export default googleOauthRouter;
