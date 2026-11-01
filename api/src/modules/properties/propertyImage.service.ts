import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { config } from '../../config';
import { pool } from '../../db';
import { AppError } from '../../lib/AppError';

const MAX_IMAGES_PER_PROPERTY = 10;

export const imageUrl = (storageKey: string) => `${config.publicUrl}/uploads/${storageKey}`;

// Checks the file's first bytes, because the file name and Content-Type are chosen by the client.
function detectImageType(file: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (file.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'jpg';
  if (file.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (file.subarray(0, 4).toString('latin1') === 'RIFF' && file.subarray(8, 12).toString('latin1') === 'WEBP') {
    return 'webp';
  }
  return null;
}

// Missing files are fine here. A failed cleanup must not fail the request that triggered it.
export async function deleteImageFiles(storageKeys: string[]) {
  await Promise.all(
    storageKeys.map((key) =>
      unlink(path.join(config.uploadDir, key)).catch((err) => {
        if (err.code !== 'ENOENT') console.error('Could not delete image file', err);
      }),
    ),
  );
}

export async function addImage(propertyId: string, file: Buffer | undefined) {
  if (!file) throw new AppError(400, 'Send the image in a form field named "image"');

  const extension = detectImageType(file);
  if (!extension) throw new AppError(400, 'Only JPEG, PNG and WebP images are allowed');

  const { rows } = await pool.query(
    'SELECT count(*)::int AS total FROM property_images WHERE property_id = $1',
    [propertyId],
  );
  if (rows[0].total >= MAX_IMAGES_PER_PROPERTY) {
    throw new AppError(409, `A listing can have at most ${MAX_IMAGES_PER_PROPERTY} images`);
  }

  const storageKey = `${randomUUID()}.${extension}`;
  await mkdir(config.uploadDir, { recursive: true });
  await writeFile(path.join(config.uploadDir, storageKey), file);

  try {
    const inserted = await pool.query(
      `INSERT INTO property_images (property_id, storage_key, position)
       SELECT $1, $2, COALESCE(MAX(position) + 1, 0) FROM property_images WHERE property_id = $1
       RETURNING id, storage_key, position`,
      [propertyId, storageKey],
    );
    const image = inserted.rows[0];
    return { id: image.id, url: imageUrl(image.storage_key), position: image.position };
  } catch (err) {
    await deleteImageFiles([storageKey]);
    // Two uploads to one listing picked the same position.
    if ((err as { code?: string }).code === '23505') throw new AppError(409, 'Upload conflict, please try again');
    throw err;
  }
}

export async function removeImage(propertyId: string, imageId: string) {
  const { rows } = await pool.query(
    'DELETE FROM property_images WHERE id = $1 AND property_id = $2 RETURNING storage_key',
    [imageId, propertyId],
  );
  if (!rows[0]) throw new AppError(404, 'Image not found');
  await deleteImageFiles([rows[0].storage_key]);
}
