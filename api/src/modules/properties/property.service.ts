import { randomBytes } from 'node:crypto';
import { pool } from '../../db';
import { AppError } from '../../lib/AppError';
import { toIdPage } from '../../lib/pagination';
import {
  cursorSchema,
  type CreatePropertyInput,
  type SearchPropertiesInput,
  type UpdatePropertyInput,
} from './property.schema';
import { deleteImageFiles, imageUrl } from './propertyImage.service';

// pg returns BIGINT as a string. Price is capped at MAX_SAFE_INTEGER, so a number is safe here.
const COLUMNS = `id, owner_id, slug, title, description, city, locality, type,
  price::float8 AS price, bedrooms, status, created_at, updated_at`;

// The search results leave out description, to keep the response small.
const SUMMARY_COLUMNS = `p.id, p.slug, p.title, p.city, p.locality, p.type,
  p.price::float8 AS price, p.bedrooms, p.created_at,
  (SELECT i.storage_key FROM property_images i WHERE i.property_id = p.id ORDER BY i.position LIMIT 1) AS cover_key`;

// Fixed values only, because column names can't be bound as parameters.
const SORTS = {
  newest: { column: 'p.created_at', cast: 'timestamptz', direction: 'DESC', operator: '<' },
  price_asc: { column: 'p.price', cast: 'bigint', direction: 'ASC', operator: '>' },
  price_desc: { column: 'p.price', cast: 'bigint', direction: 'DESC', operator: '<' },
} as const;

const SIMILAR_LIMIT = 6;

function createSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${base || 'property'}-${randomBytes(4).toString('hex')}`;
}

function toSummary({ cover_key, ...row }: { cover_key: string | null; [column: string]: unknown }) {
  return { ...row, coverImage: cover_key ? imageUrl(cover_key) : null };
}

function decodeCursor(raw: string, sort: SearchPropertiesInput['sort']) {
  let parsed;
  try {
    parsed = cursorSchema.parse(JSON.parse(Buffer.from(raw, 'base64url').toString()));
  } catch {
    throw new AppError(400, 'Invalid cursor');
  }
  // A cursor only makes sense for the sort that created it.
  if (parsed.s !== sort) throw new AppError(400, 'Cursor does not match the sort');
  return parsed;
}

const encodeCursor = (sort: SearchPropertiesInput['sort'], value: unknown, id: string) =>
  Buffer.from(JSON.stringify({ s: sort, v: value, id })).toString('base64url');

export async function searchProperties(filters: SearchPropertiesInput) {
  const sort = SORTS[filters.sort];
  const where = [`p.status = 'active'`];
  const values: unknown[] = [];
  const addFilter = (sql: string, value: unknown) => {
    values.push(value);
    where.push(sql.replace('?', `$${values.length}`));
  };

  if (filters.city) addFilter('p.city = ?', filters.city);
  if (filters.locality) {
    // Stops % and _ in the search text from acting as wildcards.
    addFilter('p.locality ILIKE ?', `%${filters.locality.replace(/[\\%_]/g, '\\$&')}%`);
  }
  if (filters.type) addFilter('p.type = ?', filters.type);
  if (filters.bedrooms !== undefined) addFilter('p.bedrooms = ?', filters.bedrooms);
  if (filters.minPrice !== undefined) addFilter('p.price >= ?', filters.minPrice);
  if (filters.maxPrice !== undefined) addFilter('p.price <= ?', filters.maxPrice);

  if (filters.cursor) {
    const cursor = decodeCursor(filters.cursor, filters.sort);
    values.push(cursor.v, cursor.id);
    where.push(
      `(${sort.column}, p.id) ${sort.operator} ($${values.length - 1}::${sort.cast}, $${values.length}::bigint)`,
    );
  }

  values.push(filters.limit + 1); // One extra row shows whether there's a next page.
  const { rows } = await pool.query(
    `SELECT ${SUMMARY_COLUMNS}
     FROM properties p
     WHERE ${where.join(' AND ')}
     ORDER BY ${sort.column} ${sort.direction}, p.id ${sort.direction}
     LIMIT $${values.length}`,
    values,
  );

  const items = rows.slice(0, filters.limit);
  const last = items.at(-1);
  const nextCursor =
    rows.length > filters.limit && last
      ? encodeCursor(
          filters.sort,
          filters.sort === 'newest' ? last.created_at.toISOString() : last.price,
          last.id,
        )
      : null;
  return { items: items.map(toSummary), nextCursor };
}

export async function createProperty(ownerId: string, input: CreatePropertyInput) {
  const { rows } = await pool.query(
    `INSERT INTO properties (owner_id, slug, title, description, city, locality, type, price, bedrooms)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${COLUMNS}`,
    [ownerId, createSlug(input.title), input.title, input.description, input.city,
      input.locality, input.type, input.price, input.bedrooms],
  );
  return rows[0];
}

export async function getPropertyBySlug(slug: string) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS},
       COALESCE(
         (SELECT json_agg(json_build_object('id', i.id, 'storageKey', i.storage_key, 'position', i.position) ORDER BY i.position)
          FROM property_images i WHERE i.property_id = properties.id),
         '[]'
       ) AS images
     FROM properties
     WHERE slug = $1 AND status = 'active'`,
    [slug],
  );
  if (!rows[0]) throw new AppError(404, 'Property not found');

  const images = rows[0].images.map((image: { id: number; storageKey: string; position: number }) => ({
    id: String(image.id),
    url: imageUrl(image.storageKey),
    position: image.position,
  }));
  return { ...rows[0], images };
}

export async function getMyProperties(ownerId: string, limit: number, cursor?: string) {
  const values: unknown[] = [ownerId, limit + 1];
  let afterCursor = '';
  if (cursor) {
    values.push(cursor);
    afterCursor = 'AND id < $3';
  }
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM properties
     WHERE owner_id = $1 ${afterCursor}
     ORDER BY id DESC
     LIMIT $2`,
    values,
  );
  return toIdPage(rows, limit);
}

export async function getSimilarProperties(slug: string) {
  const { rows } = await pool.query(
    `SELECT id, city, type, price::float8 AS price, bedrooms
     FROM properties WHERE slug = $1 AND status = 'active'`,
    [slug],
  );
  const target = rows[0];
  if (!target) throw new AppError(404, 'Property not found');

  // Computed here so the range stays a whole number and can use idx_similar.
  const low = Math.floor(target.price * 0.8);
  const high = Math.ceil(target.price * 1.2);

  // Each tier only runs if the one before it didn't find enough.
  const tiers = [
    { sql: 'p.city = $1 AND p.type = $2 AND p.price BETWEEN $3 AND $4', params: [target.city, target.type, low, high] },
    { sql: 'p.city = $1 AND p.type = $2', params: [target.city, target.type] },
    { sql: 'p.city = $1', params: [target.city] },
  ];

  const found: { id: string; cover_key: string | null }[] = [];
  for (const tier of tiers) {
    const next = tier.params.length + 1;
    const result = await pool.query(
      `SELECT ${SUMMARY_COLUMNS}
       FROM properties p
       WHERE ${tier.sql} AND p.status = 'active' AND p.id <> ALL($${next}::bigint[])
       ORDER BY ABS(p.bedrooms - $${next + 1}::smallint), ABS(p.price - $${next + 2}::bigint), p.id
       LIMIT $${next + 3}`,
      [...tier.params, [target.id, ...found.map((row) => row.id)], target.bedrooms, target.price,
        SIMILAR_LIMIT - found.length],
    );
    found.push(...result.rows);
    if (found.length >= SIMILAR_LIMIT) break;
  }
  return found.map(toSummary);
}

export async function assertOwner(id: string, ownerId: string) {
  const { rows } = await pool.query('SELECT owner_id FROM properties WHERE id = $1', [id]);
  if (!rows[0]) throw new AppError(404, 'Property not found');
  if (rows[0].owner_id !== ownerId) throw new AppError(403, 'You can only change your own listings');
}

export async function updateProperty(id: string, ownerId: string, input: UpdatePropertyInput) {
  const { rows } = await pool.query(
    `UPDATE properties SET
       title       = COALESCE($3, title),
       description = COALESCE($4, description),
       city        = COALESCE($5, city),
       locality    = COALESCE($6, locality),
       type        = COALESCE($7::property_type, type),
       price       = COALESCE($8::bigint, price),
       bedrooms    = COALESCE($9::smallint, bedrooms),
       status      = COALESCE($10, status),
       updated_at  = now()
     WHERE id = $1 AND owner_id = $2
     RETURNING ${COLUMNS}`,
    [id, ownerId, input.title ?? null, input.description ?? null, input.city ?? null,
      input.locality ?? null, input.type ?? null, input.price ?? null,
      input.bedrooms ?? null, input.status ?? null],
  );
  // No row matched, so work out whether the listing is missing or someone else's.
  if (!rows[0]) await assertOwner(id, ownerId);
  return rows[0];
}

export async function deleteProperty(id: string, ownerId: string) {
  const { rows: images } = await pool.query(
    `SELECT i.storage_key FROM property_images i
     JOIN properties p ON p.id = i.property_id
     WHERE p.id = $1 AND p.owner_id = $2`,
    [id, ownerId],
  );
  const { rowCount } = await pool.query(
    'DELETE FROM properties WHERE id = $1 AND owner_id = $2',
    [id, ownerId],
  );
  if (!rowCount) {
    await assertOwner(id, ownerId);
    return;
  }
  await deleteImageFiles(images.map((image) => image.storage_key));
}
