import { Router } from 'express';
import Container from 'typedi';
import { AuthController } from 'controllers/authController';
import { AuthMiddleware } from 'middlewares/authMiddleware';

const authRouter: Router = Router();
const authMiddleware = Container.get(AuthMiddleware);
const authController = Container.get(AuthController);

authRouter.post('/register', authController.register);

authRouter.post('/register/verify', authController.verifyEmail);

authRouter.post('/account/create', authController.createAccount);

authRouter.post('/login', authController.login);

authRouter.post('/password/reset/initiate', authController.initiatePasswordReset);

authRouter.post('/password/reset/verify', authController.verifyPasswordResetToken);

authRouter.post('/password/reset', authController.resetPassword);

authRouter.get('/refresh-token', authMiddleware.refreshToken);

export default authRouter;
