import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { pool } from './db';
import { openApiSpec } from './docs/openapi';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { authRouter } from './modules/auth/auth.routes';
import { inquiryRouter } from './modules/inquiries/inquiry.routes';
import { propertyRouter } from './modules/properties/property.routes';

export const app = express();

app.set('trust proxy', config.trustProxy);
app.disable('x-powered-by');

app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// Above helmet, because helmet's content security policy blocks Swagger UI's inline code.
app.get('/api-docs.json', (_req, res) => {
  res.json(openApiSpec);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

// Images are loaded by the frontend from another origin.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(compression());
app.use(express.json());
app.use(cookieParser());

app.use('/uploads', express.static(config.uploadDir, { maxAge: '30d', immutable: true, index: false }));

app.get('/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok' });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/properties', propertyRouter);
app.use('/api/v1', inquiryRouter);

app.use(notFound);
app.use(errorHandler);
