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
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  publicUrl: process.env.PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 4000}`,
  uploadDir: path.resolve(process.env.UPLOAD_DIR ?? 'uploads'),
  // Number of proxies in front of the API. It must match the real setup, or rate limits see the wrong IP.
  trustProxy: Number(process.env.TRUST_PROXY ?? 0),
};
