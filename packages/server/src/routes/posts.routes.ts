import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../auth/middleware';
import { postService } from '../modules/posts/post.service';
import { parsePagination, buildPaginationResult } from '../utils/pagination';

const router = Router();

const createPostSchema = z.object({
  channel_id: z.string(),
  type: z.enum(['update', 'insight', 'question', 'answer', 'alert', 'metric']).optional(),
  title: z.string().optional(),
  content: z.string().min(1),
  metadata: z.record(z.any()).optional(),
  parent_id: z.string().optional(),
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = createPostSchema.parse(req.body);
    const post = await postService.createPost(req.auth!.orgId, {
      ...body,
      author_id: req.auth!.id,
      author_type: req.auth!.type,
    });
    res.status(201).json({ success: true, data: post });
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
  const filters = {
    channel_id: req.query.channel_id as string | undefined,
    type: req.query.type as string | undefined,
    author_id: req.query.author_id as string | undefined,
  };
  const { posts, total } = await postService.listPosts(req.auth!.orgId, filters, limit, offset);
  res.json({
    success: true,
    data: posts,
    pagination: buildPaginationResult(page, limit, total),
  });
});

router.get('/search', async (req: AuthenticatedRequest, res: Response) => {
  const q = req.query.q as string;
  if (!q) {
    res.status(400).json({ success: false, error: { code: 'MISSING_QUERY', message: 'Search query required' } });
    return;
  }
  const { limit, offset, page } = parsePagination(req);
  const { posts, total } = await postService.searchPosts(req.auth!.orgId, q, limit, offset);
  res.json({
    success: true,
    data: posts,
    pagination: buildPaginationResult(page, limit, total),
  });
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const post = await postService.getPost(req.params.id, req.auth!.orgId);
  if (!post) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
    return;
  }
  res.json({ success: true, data: post });
});

export default router;
