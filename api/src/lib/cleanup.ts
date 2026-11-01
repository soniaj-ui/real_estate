import { pool } from '../db';

// The table only grows otherwise. Runs hourly from server.ts.
export async function deleteExpiredRows() {
  await pool.query('DELETE FROM refresh_tokens WHERE expires_at < now()');
}
