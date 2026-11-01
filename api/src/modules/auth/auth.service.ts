import { createHash, randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Pool, PoolClient } from 'pg';
import { config } from '../../config';
import { pool, withTransaction } from '../../db';
import { AppError } from '../../lib/AppError';

const BCRYPT_ROUNDS = 12;
// Compared when the email is unknown, so both login failures take similar time.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

async function issueTokens(userId: string, familyId: string = randomUUID(), db: Pool | PoolClient = pool) {
  const accessToken = jwt.sign({}, config.jwtSecret, {
    subject: userId,
    expiresIn: '15m',
    algorithm: 'HS256',
  });
  const refreshToken = randomBytes(32).toString('base64url');

  await db.query(
    `INSERT INTO refresh_tokens (user_id, family_id, token_hash, expires_at)
     VALUES ($1, $2, $3, now() + interval '30 days')`,
    [userId, familyId, sha256(refreshToken)],
  );
  return { accessToken, refreshToken };
}

export async function register(input: { name: string; email: string; password: string }) {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO NOTHING
     RETURNING id, name, email`,
    [input.name, input.email, passwordHash],
  );
  if (!rows[0]) throw new AppError(409, 'Email is already registered');
  return { user: rows[0], ...(await issueTokens(rows[0].id)) };
}

export async function login(input: { email: string; password: string }) {
  const { rows } = await pool.query(
    'SELECT id, name, email, password_hash FROM users WHERE email = $1',
    [input.email],
  );
  const row = rows[0];
  const matches = await bcrypt.compare(input.password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !matches) throw new AppError(401, 'Invalid email or password');

  return {
    user: { id: row.id, name: row.name, email: row.email },
    ...(await issueTokens(row.id)),
  };
}

export async function refresh(rawToken: string) {
  const hash = sha256(rawToken);

  // Revoking and issuing together means a crash can't leave a user with no valid token.
  const tokens = await withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE refresh_tokens SET revoked_at = now()
       WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()
       RETURNING user_id, family_id`,
      [hash],
    );
    return rows[0] ? issueTokens(rows[0].user_id, rows[0].family_id, client) : null;
  });
  if (tokens) return tokens;

  // The token is unknown, expired or already used. Reuse may mean it was stolen.
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = now()
     WHERE revoked_at IS NULL AND family_id =
       (SELECT family_id FROM refresh_tokens WHERE token_hash = $1)`,
    [hash],
  );
  throw new AppError(401, 'Invalid refresh token');
}

export async function logout(rawToken: string) {
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = now()
     WHERE revoked_at IS NULL AND family_id =
       (SELECT family_id FROM refresh_tokens WHERE token_hash = $1)`,
    [sha256(rawToken)],
  );
}

export async function getUser(userId: string) {
  const { rows } = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [userId]);
  if (!rows[0]) throw new AppError(401, 'Authentication required');
  return rows[0];
}
