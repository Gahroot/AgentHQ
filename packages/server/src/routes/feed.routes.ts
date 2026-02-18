import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../auth/middleware';
import { feedService, parseFeedTypes } from '../modules/feed/feed.service';
import { parsePagination } from '../utils/pagination';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const { limit, offset, page } = parsePagination(req);
  const types = parseFeedTypes(req.query.types as string | undefined);

  const { items, total, hasMore } = await feedService.getFeed(
    req.auth!.orgId,
    {
      since: req.query.since as string | undefined,
      until: req.query.until as string | undefined,
      types,
      actor_id: req.query.actor_id as string | undefined,
    },
    limit,
    offset,
  );

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, hasMore },
  });
});

export default router;
