import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../auth/middleware';
import { activityService } from '../modules/activity/activity.service';
import { parsePagination, buildPaginationResult } from '../utils/pagination';

const router = Router();

const logActivitySchema = z.object({
  action: z.string().min(1),
  resource_type: z.string().optional(),
  resource_id: z.string().optional(),
  details: z.record(z.any()).optional(),
});

router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const body = logActivitySchema.parse(req.body);
    const entry = await activityService.logActivity(req.auth!.orgId, {
      actor_id: req.auth!.id,
      actor_type: req.auth!.type,
      action: body.action,
      resource_type: body.resource_type,
      resource_id: body.resource_id,
      details: body.details,
      ip_address: req.ip,
    });
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    next(err);
  }
});

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const { limit, offset, page } = parsePagination(req);
  const filters = {
    actor_id: req.query.actor_id as string | undefined,
    action: req.query.action as string | undefined,
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
  };
  const { entries, total } = await activityService.queryActivity(req.auth!.orgId, filters, limit, offset);
  res.json({
    success: true,
    data: entries,
    pagination: buildPaginationResult(page, limit, total),
  });
});

export default router;
