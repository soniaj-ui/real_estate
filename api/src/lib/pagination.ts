import { z } from 'zod';

export const idSchema = z.string().regex(/^[1-9]\d{0,17}$/, 'Invalid id');

export const idPageSchema = z.object({
  limit: z.string()
    .regex(/^\d{1,2}$/)
    .transform(Number)
    .pipe(z.number().min(1).max(50))
    .default(20),

  cursor: idSchema.optional(),
});

export function toIdPage(rows: { id: string }[], limit: number) {
  const items = rows.slice(0, limit);

  let nextCursor: string | null = null;
  if (rows.length > limit) {
    nextCursor = items[limit - 1].id;
  }

  return { items, nextCursor };
}
