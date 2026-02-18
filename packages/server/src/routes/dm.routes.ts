import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../auth/middleware';
import { channelService } from '../modules/channels/channel.service';

const router = Router();

const createDmSchema = z.object({
  member_id: z.string(),
  member_type: z.string(),
});

router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const body = createDmSchema.parse(req.body);
    const channel = await channelService.findOrCreateDM(
      req.auth!.orgId,
      req.auth!.id,
      req.auth!.type,
      body.member_id,
      body.member_type,
    );
    res.json({ success: true, data: channel });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    next(err);
  }
});

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const channels = await channelService.listDMConversations(req.auth!.id, req.auth!.orgId);
  res.json({ success: true, data: channels });
});

export default router;
