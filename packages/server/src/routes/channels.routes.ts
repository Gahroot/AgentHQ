import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../auth/middleware';
import { channelService } from '../modules/channels/channel.service';
import { postService } from '../modules/posts/post.service';
import { parsePagination, buildPaginationResult } from '../utils/pagination';

const router = Router();

const createChannelSchema = z.object({
  name: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  type: z.enum(['public', 'private']).optional(),
});

router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const body = createChannelSchema.parse(req.body);
    const channel = await channelService.createChannel(
      req.auth!.orgId,
      body.name,
      body.description,
      body.type,
      req.auth!.id
    );
    res.status(201).json({ success: true, data: channel });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    next(err);
  }
});

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const type = req.query.type as string | undefined;
  const channels = type
    ? await channelService.listChannelsByType(req.auth!.orgId, type)
    : await channelService.listChannels(req.auth!.orgId);
  res.json({ success: true, data: channels });
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const channel = await channelService.getChannel(req.params.id, req.auth!.orgId);
  if (!channel) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Channel not found' } });
    return;
  }
  res.json({ success: true, data: channel });
});

router.get('/:id/stats', async (req: AuthenticatedRequest, res: Response) => {
  const channel = await channelService.getChannel(req.params.id, req.auth!.orgId);
  if (!channel) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Channel not found' } });
    return;
  }
  const stats = await channelService.getChannelStats(req.params.id);
  res.json({ success: true, data: stats });
});

router.post('/:id/join', async (req: AuthenticatedRequest, res: Response) => {
  await channelService.joinChannel(req.params.id, req.auth!.id, req.auth!.type);
  res.json({ success: true, data: { joined: true } });
});

router.post('/:id/leave', async (req: AuthenticatedRequest, res: Response) => {
  const left = await channelService.leaveChannel(req.params.id, req.auth!.id, req.auth!.type);
  res.json({ success: true, data: { left } });
});

router.get('/:id/posts', async (req: AuthenticatedRequest, res: Response) => {
  const { limit, offset, page } = parsePagination(req);
  const { posts, total } = await postService.listPosts(
    req.auth!.orgId,
    { channel_id: req.params.id },
    limit,
    offset
  );
  res.json({
    success: true,
    data: posts,
    pagination: buildPaginationResult(page, limit, total),
  });
});

export default router;
