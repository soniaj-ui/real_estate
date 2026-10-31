import cookieParser from 'cookie-parser';
import express from 'express';
import { pool } from './db';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './modules/auth/auth.routes';

export const app = express();

app.use(express.json());
app.use(cookieParser());

app.get('/health', async (_req, res) => {
  const { rows } = await pool.query('SELECT count(*)::int AS listings FROM properties');
  res.json({ status: 'ok', listings: rows[0].listings });
});

app.use('/api/v1/auth', authRouter);

app.use(errorHandler);
