import { Pool, type PoolClient } from 'pg';

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// An idle connection can fail if the database restarts. Without a listener, that crashes the process.
pool.on('error', (err) => {
  console.error('Idle database connection error', err);
});

export async function withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
