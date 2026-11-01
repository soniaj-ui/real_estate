import { z } from 'zod';

const MAX_LINKS = 1;

export const createInquirySchema = z.object({
  message: z
    .string()
    .trim()
    .min(10)
    .max(1000)
    .refine((text) => (text.match(/https?:\/\//gi) ?? []).length <= MAX_LINKS, {
      message: 'A message can contain at most one link',
    }),
  // A honeypot: hidden from real users in the form, so only bots fill it in.
  website: z.string().max(0, 'Invalid submission').optional(),
});
