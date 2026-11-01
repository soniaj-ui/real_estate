import 'dotenv/config';
import { app } from './app';
import { pool } from './db';
import { deleteExpiredRows } from './lib/cleanup';

const port = Number(process.env.PORT) || 4000;
const ONE_HOUR = 60 * 60 * 1000;
const SHUTDOWN_TIMEOUT = 10 * 1000;

const server = app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
  console.log(`API docs at http://localhost:${port}/api-docs`);
});

const cleanupTimer = setInterval(() => {
  deleteExpiredRows().catch((err) => console.error('Cleanup failed', err));
}, ONE_HOUR);
cleanupTimer.unref();

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  clearInterval(cleanupTimer);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
