import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../auth/middleware';
import { queryService } from '../modules/query/query.service';

const router = Router();

const querySchema = z.object({
  question: z.string().min(1).max(2000),
  context: z.record(z.any()).optional(),
});

router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const body = querySchema.parse(req.body);

    const result = await queryService.answerQuestion(req.auth!.orgId, body.question, body.context);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    next(err);
  }
});

export default router;
