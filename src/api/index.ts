import { Router } from 'express';
import authRouter from './routes/authRoutes/auth';
import roomRouter from './routes/roomRoutes/room';
import googleOauthRouter from './routes/authRoutes/oauth';

const app: Router = Router();
app.use('/auth', authRouter);
app.use('/auth', googleOauthRouter);
app.use('/rooms', roomRouter);

export default app;
