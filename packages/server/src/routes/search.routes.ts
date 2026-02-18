import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../auth/middleware';
import { searchService, parseSearchTypes } from '../modules/search/search.service';
import { parsePagination } from '../utils/pagination';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const q = req.query.q as string;
  if (!q) {
    res.status(400).json({
      success: false,
      error: { code: 'MISSING_QUERY', message: 'Search query parameter "q" is required' },
    });
    return;
  }

  const { limit, offset, page } = parsePagination(req);
  const types = parseSearchTypes(req.query.types as string | undefined);

  const { data, counts, total } = await searchService.search(
    req.auth!.orgId,
    q,
    types,
    limit,
    offset,
  );

  res.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      counts,
      total,
    },
  });
});

export default router;
