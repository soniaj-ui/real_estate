import { pool } from '../db';

// Both tables only grow otherwise. Runs hourly from server.ts.
export async function deleteExpiredRows() {
  await pool.query('DELETE FROM refresh_tokens WHERE expires_at < now()');
  await pool.query('DELETE FROM rate_limits WHERE reset_at < now()');
}
