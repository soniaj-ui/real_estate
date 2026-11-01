import { Router } from 'express';
import multer from 'multer';
import { idPageSchema, idSchema } from '../../lib/pagination';
import { writeLimiter } from '../../middleware/rateLimit';
import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import { createPropertySchema, searchPropertiesSchema, updatePropertySchema } from './property.schema';
import * as propertyService from './property.service';
import * as imageService from './propertyImage.service';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } });

export const propertyRouter = Router();

propertyRouter.get('/', async (req, res) => {
  res.json(await propertyService.searchProperties(searchPropertiesSchema.parse(req.query)));
});

propertyRouter.post('/', requireAuth, writeLimiter, validate(createPropertySchema), async (req, res) => {
  const property = await propertyService.createProperty(req.user!.id, req.body);
  res.status(201).json({ property });
});

// Must stay above /:slug, or "mine" would be treated as a slug.
propertyRouter.get('/mine', requireAuth, async (req, res) => {
  const { limit, cursor } = idPageSchema.parse(req.query);
  res.json(await propertyService.getMyProperties(req.user!.id, limit, cursor));
});

propertyRouter.get('/:slug', async (req, res) => {
  res.json({ property: await propertyService.getPropertyBySlug(req.params.slug) });
});

propertyRouter.get('/:slug/similar', async (req, res) => {
  const items = await propertyService.getSimilarProperties(req.params.slug);
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ items });
});

propertyRouter.patch('/:id', requireAuth, writeLimiter, validate(updatePropertySchema), async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const property = await propertyService.updateProperty(id, req.user!.id, req.body);
  res.json({ property });
});

propertyRouter.delete('/:id', requireAuth, writeLimiter, async (req, res) => {
  const id = idSchema.parse(req.params.id);
  await propertyService.deleteProperty(id, req.user!.id);
  res.status(204).end();
});

propertyRouter.post('/:id/images', requireAuth, writeLimiter, upload.single('image'), async (req, res) => {
  const id = idSchema.parse(req.params.id);
  await propertyService.assertOwner(id, req.user!.id);
  const image = await imageService.addImage(id, req.file?.buffer);
  res.status(201).json({ image });
});

propertyRouter.delete('/:id/images/:imageId', requireAuth, writeLimiter, async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const imageId = idSchema.parse(req.params.imageId);
  await propertyService.assertOwner(id, req.user!.id);
  await imageService.removeImage(id, imageId);
  res.status(204).end();
});
