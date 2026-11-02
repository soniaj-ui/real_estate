import path from 'node:path';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

const jwtSecret = required('JWT_SECRET');
if (jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');

export const config = {
  jwtSecret,
  isProduction: process.env.NODE_ENV === 'production',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  // Shared with the frontend, so only this API can tell it to refresh a cached page.
  revalidateSecret: process.env.REVALIDATE_SECRET,
  publicUrl: process.env.PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 4000}`,
  uploadDir: path.resolve(process.env.UPLOAD_DIR ?? 'uploads'),
  // Number of proxies in front of the API. It must match the real setup, or rate limits see the wrong IP.
  trustProxy: Number(process.env.TRUST_PROXY ?? 0),
};
