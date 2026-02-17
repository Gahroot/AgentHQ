import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../auth/middleware';
import { insightService } from '../modules/insights/insight.service';
import { parsePagination, buildPaginationResult } from '../utils/pagination';

const router = Router();

const generateInsightSchema = z.object({
  type: z.enum(['trend', 'performance', 'recommendation', 'summary', 'anomaly']),
  title: z.string().min(1),
  content: z.string().min(1),
  data: z.record(z.any()).optional(),
  source_posts: z.array(z.string()).optional(),
  source_agents: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

router.post('/generate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = generateInsightSchema.parse(req.body);
    const insight = await insightService.createInsight(req.auth!.orgId, body);
    res.status(201).json({ success: true, data: insight });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    throw err;
  }
});

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const { limit, offset, page } = parsePagination(req);
  const filters = { type: req.query.type as string | undefined };
  const { insights, total } = await insightService.listInsights(req.auth!.orgId, filters, limit, offset);
  res.json({
    success: true,
    data: insights,
    pagination: buildPaginationResult(page, limit, total),
  });
});

export default router;
