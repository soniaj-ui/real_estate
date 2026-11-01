import type { Request } from 'express';
import rateLimit, { ipKeyGenerator, type ClientRateLimitInfo, type Options, type Store } from 'express-rate-limit';
import { pool } from '../db';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// Counts live in PostgreSQL, so every API server shares them with no extra service to run.
class PostgresStore implements Store {
  private windowMs = MINUTE;

  constructor(public prefix: string) {}

  init(options: Options) {
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const { rows } = await pool.query(
      `INSERT INTO rate_limits (key, hits, reset_at)
       VALUES ($1, 1, now() + $2 * interval '1 millisecond')
       ON CONFLICT (key) DO UPDATE SET
         hits     = CASE WHEN rate_limits.reset_at <= now() THEN 1 ELSE rate_limits.hits + 1 END,
         reset_at = CASE WHEN rate_limits.reset_at <= now() THEN EXCLUDED.reset_at ELSE rate_limits.reset_at END
       RETURNING hits, reset_at`,
      [this.prefix + key, this.windowMs],
    );
    return { totalHits: rows[0].hits, resetTime: rows[0].reset_at };
  }

  async decrement(key: string) {
    await pool.query('UPDATE rate_limits SET hits = GREATEST(hits - 1, 0) WHERE key = $1', [this.prefix + key]);
  }

  async resetKey(key: string) {
    await pool.query('DELETE FROM rate_limits WHERE key = $1', [this.prefix + key]);
  }
}

function createLimiter(prefix: string, windowMs: number, limit: number, options: Partial<Options> = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    store: new PostgresStore(`${prefix}:`),
    message: { error: 'Too many requests, please try again later' },
    ...options,
  });
}

const clientIp = (req: Request) => ipKeyGenerator(req.ip ?? '');
const userId = (req: Request) => req.user?.id ?? clientIp(req);

export const registerLimiter = createLimiter('register', HOUR, 10);
export const refreshLimiter = createLimiter('refresh', 15 * MINUTE, 120);

// Only failed logins count, so normal users are never affected. Runs after validate, so the email is normalised.
export const loginAccountLimiter = createLimiter('login-account', 15 * MINUTE, 10, {
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${clientIp(req)}:${req.body.email}`,
});
export const loginIpLimiter = createLimiter('login-ip', 15 * MINUTE, 100, { skipSuccessfulRequests: true });

export const writeLimiter = createLimiter('write', MINUTE, 60, { keyGenerator: userId });

export const inquiryUserLimiter = createLimiter('inquiry-user', HOUR, 10, { keyGenerator: userId });
export const inquiryIpLimiter = createLimiter('inquiry-ip', HOUR, 30);
