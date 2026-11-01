import { z } from 'zod';
import { idSchema } from '../../lib/pagination';

export const PROPERTY_TYPES = ['apartment', 'villa', 'plot', 'commercial'] as const;
export const SORT_OPTIONS = ['newest', 'price_asc', 'price_desc'] as const;

const baseFields = {
  title: z.string().trim().min(5).max(150),
  city: z.string().trim().toLowerCase().min(2).max(100),
  locality: z.string().trim().min(2).max(100),
  type: z.enum(PROPERTY_TYPES),
  price: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  bedrooms: z.number().int().min(0).max(50),
};

export const createPropertySchema = z.object({
  ...baseFields,
  description: z.string().trim().max(5000).default(''),
});

export const updatePropertySchema = z
  .object({
    ...baseFields,
    description: z.string().trim().max(5000),
    status: z.enum(['active', 'inactive']),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Provide at least one field' });

// Query strings are always text, so these stay strict rather than using z.coerce, which reads "" as 0.
const wholeNumber = (max: number) =>
  z.string().regex(/^\d{1,16}$/).transform(Number).pipe(z.number().max(max));

export const searchPropertiesSchema = z
  .object({
    city: z.string().trim().toLowerCase().min(1).max(100).optional(),
    locality: z.string().trim().min(2).max(100).optional(),
    type: z.enum(PROPERTY_TYPES).optional(),
    bedrooms: wholeNumber(50).optional(),
    minPrice: wholeNumber(Number.MAX_SAFE_INTEGER).optional(),
    maxPrice: wholeNumber(Number.MAX_SAFE_INTEGER).optional(),
    sort: z.enum(SORT_OPTIONS).default('newest'),
    limit: wholeNumber(50).pipe(z.number().min(1)).default(20),
    cursor: z.string().max(200).optional(),
  })
  .refine((q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice, {
    message: 'minPrice cannot be greater than maxPrice',
    path: ['minPrice'],
  });

export const cursorSchema = z.discriminatedUnion('s', [
  z.object({ s: z.literal('newest'), v: z.iso.datetime(), id: idSchema }),
  z.object({
    s: z.enum(['price_asc', 'price_desc']),
    v: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    id: idSchema,
  }),
]);

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type SearchPropertiesInput = z.infer<typeof searchPropertiesSchema>;
