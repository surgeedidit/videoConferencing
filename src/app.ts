import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middlewares/errorHandlerMiddleware';
import { RouteNotFoundError } from './utils/shared/customErrorClasses';
import applicationRouter from './api/index';
import { swaggerSpec } from './config/swaggerConfig';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import '@services/googleAuthService';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://oak-park-frontend.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(passport.initialize());

app.get('/', (_req, res) => {
  res.status(200).send('All good!');
});

app.use('/api/v1', applicationRouter);

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((req: Request, _res: Response, next: NextFunction) => {
    const error: RouteNotFoundError = new RouteNotFoundError(req);
    next(error);
});

app.use(errorHandler);

export default app;
