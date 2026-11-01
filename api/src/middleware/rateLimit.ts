import type { Request } from 'express';
import rateLimit, { ipKeyGenerator, type Options } from 'express-rate-limit';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// Counts are kept in memory. With several API servers, this would need a shared store such as Redis.
function createLimiter(windowMs: number, limit: number, options: Partial<Options> = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
    ...options,
  });
}

const clientIp = (req: Request) => ipKeyGenerator(req.ip ?? '');
const userId = (req: Request) => req.user?.id ?? clientIp(req);

export const registerLimiter = createLimiter(HOUR, 10);
export const refreshLimiter = createLimiter(15 * MINUTE, 120);

// Only failed logins count, so normal users are never affected. Runs after validate, so the email is normalised.
export const loginAccountLimiter = createLimiter(15 * MINUTE, 10, {
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${clientIp(req)}:${req.body.email}`,
});
export const loginIpLimiter = createLimiter(15 * MINUTE, 100, { skipSuccessfulRequests: true });

export const writeLimiter = createLimiter(MINUTE, 60, { keyGenerator: userId });

export const inquiryUserLimiter = createLimiter(HOUR, 10, { keyGenerator: userId });
export const inquiryIpLimiter = createLimiter(HOUR, 30);
