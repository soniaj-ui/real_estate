import { Router } from 'express';
import { idPageSchema, idSchema } from '../../lib/pagination';
import { inquiryIpLimiter, inquiryUserLimiter } from '../../middleware/rateLimit';
import { requireAuth } from '../../middleware/requireAuth';
import { validate } from '../../middleware/validate';
import { createInquirySchema } from './inquiry.schema';
import * as inquiryService from './inquiry.service';

export const inquiryRouter = Router();

inquiryRouter.post(
  '/properties/:id/inquiries',
  requireAuth,
  inquiryIpLimiter,
  inquiryUserLimiter,
  validate(createInquirySchema),
  async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const inquiry = await inquiryService.createInquiry(id, req.user!.id, req.body.message);
    res.status(201).json({ inquiry });
  },
);

inquiryRouter.get('/inquiries/received', requireAuth, async (req, res) => {
  const { limit, cursor } = idPageSchema.parse(req.query);
  res.json(await inquiryService.getReceivedInquiries(req.user!.id, limit, cursor));
});

inquiryRouter.get('/inquiries/sent', requireAuth, async (req, res) => {
  const { limit, cursor } = idPageSchema.parse(req.query);
  res.json(await inquiryService.getSentInquiries(req.user!.id, limit, cursor));
});
