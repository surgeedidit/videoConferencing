import swaggerJSDoc, { Options } from 'swagger-jsdoc';
import { PORT } from './env';

const options: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OAU Video Conferencing API',
      version: '1.0.0',
      description: 'API documentation for the OAU video conferencing backend.',
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api/v1`,
        description: 'Local development server',
      },
    ],
  },
  apis: ['src/docs/*.yaml'], 
};

export const swaggerSpec = swaggerJSDoc(options);
