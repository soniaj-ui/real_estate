import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../lib/AppError';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError(401, 'Authentication required');

  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || !payload.sub) throw new Error('Invalid payload');
    req.user = { id: payload.sub };
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
  next();
};
