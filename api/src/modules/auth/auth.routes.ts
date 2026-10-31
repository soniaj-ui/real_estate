import { Router, type CookieOptions } from 'express';
import { config } from '../../config';
import { AppError } from '../../lib/AppError';
import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import { loginSchema, registerSchema } from './auth.schema';
import * as authService from './auth.service';

const COOKIE_NAME = 'refreshToken';
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'lax',
  path: '/api/v1/auth',
};
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);
  res.cookie(COOKIE_NAME, refreshToken, { ...cookieOptions, maxAge: COOKIE_MAX_AGE });
  res.status(201).json({ user, accessToken });
});

authRouter.post('/login', validate(loginSchema), async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  res.cookie(COOKIE_NAME, refreshToken, { ...cookieOptions, maxAge: COOKIE_MAX_AGE });
  res.json({ user, accessToken });
});

authRouter.post('/refresh', async (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) throw new AppError(401, 'Invalid refresh token');

  const { accessToken, refreshToken } = await authService.refresh(token);
  res.cookie(COOKIE_NAME, refreshToken, { ...cookieOptions, maxAge: COOKIE_MAX_AGE });
  res.json({ accessToken });
});

authRouter.post('/logout', async (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (token) await authService.logout(token);
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.status(204).end();
});

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ user: await authService.getUser(req.user!.id) });
});
