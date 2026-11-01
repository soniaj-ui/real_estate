import { pool } from '../../db';
import { AppError } from '../../lib/AppError';
import { toIdPage } from '../../lib/pagination';

export async function createInquiry(propertyId: string, senderId: string, message: string) {
  // One statement, so the checks and the insert can't be split by another request.
  const { rows } = await pool.query(
    `INSERT INTO inquiries (property_id, sender_id, message)
     SELECT id, $2, $3 FROM properties
     WHERE id = $1 AND owner_id <> $2 AND status = 'active'
     ON CONFLICT (property_id, sender_id) DO NOTHING
     RETURNING id, property_id, message, created_at`,
    [propertyId, senderId, message],
  );
  if (rows[0]) return rows[0];

  // Nothing was inserted, so work out why.
  const property = await pool.query('SELECT owner_id, status FROM properties WHERE id = $1', [propertyId]);
  const found = property.rows[0];
  if (!found || found.status !== 'active') throw new AppError(404, 'Property not found');
  if (found.owner_id === senderId) throw new AppError(403, 'You cannot send an inquiry to your own listing');
  throw new AppError(409, 'You have already sent an inquiry for this listing');
}

export async function getReceivedInquiries(ownerId: string, limit: number, cursor?: string) {
  const values: unknown[] = [ownerId, limit + 1];
  let afterCursor = '';
  if (cursor) {
    values.push(cursor);
    afterCursor = 'AND i.id < $3';
  }
  const { rows } = await pool.query(
    `SELECT i.id, i.message, i.created_at,
       p.id AS property_id, p.slug AS property_slug, p.title AS property_title,
       u.name AS sender_name, u.email AS sender_email
     FROM inquiries i
     JOIN properties p ON p.id = i.property_id
     JOIN users u ON u.id = i.sender_id
     WHERE p.owner_id = $1 ${afterCursor}
     ORDER BY i.id DESC
     LIMIT $2`,
    values,
  );
  return toIdPage(rows, limit);
}

export async function getSentInquiries(senderId: string, limit: number, cursor?: string) {
  const values: unknown[] = [senderId, limit + 1];
  let afterCursor = '';
  if (cursor) {
    values.push(cursor);
    afterCursor = 'AND i.id < $3';
  }
  const { rows } = await pool.query(
    `SELECT i.id, i.message, i.created_at,
       p.id AS property_id, p.slug AS property_slug, p.title AS property_title
     FROM inquiries i
     JOIN properties p ON p.id = i.property_id
     WHERE i.sender_id = $1 ${afterCursor}
     ORDER BY i.id DESC
     LIMIT $2`,
    values,
  );
  return toIdPage(rows, limit);
}
