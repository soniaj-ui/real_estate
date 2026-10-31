import express from 'express';
import { pool } from './db';

export const app = express();

app.use(express.json());

app.get('/health', async (_req, res) => {
  const { rows } = await pool.query('SELECT count(*)::int AS listings FROM properties');
  res.json({ status: 'ok', listings: rows[0].listings });
});
