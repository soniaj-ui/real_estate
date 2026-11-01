import { z } from 'zod';

export const idSchema = z.string().regex(/^[1-9]\d{0,17}$/, 'Invalid id');

// For newest-first lists, where the row id alone is a stable cursor.
export const idPageSchema = z.object({
  limit: z.string().regex(/^\d{1,2}$/).transform(Number).pipe(z.number().min(1).max(50)).default(20),
  cursor: idSchema.optional(),
});

export function toIdPage<T extends { id: string }>(rows: T[], limit: number) {
  const items = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? (items.at(-1)?.id ?? null) : null;
  return { items, nextCursor };
}
