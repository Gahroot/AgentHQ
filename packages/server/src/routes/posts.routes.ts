import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../auth/middleware';
import { postService } from '../modules/posts/post.service';
import { reactionService } from '../modules/reactions/reaction.service';
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

const editPostSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
}).refine(data => data.title !== undefined || data.content !== undefined, {
  message: 'At least one of title or content must be provided',
});

const addReactionSchema = z.object({
  emoji: z.string().min(1).max(32),
});

router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
    next(err);
  }
});

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const { limit, offset, page } = parsePagination(req);
  const filters = {
    channel_id: req.query.channel_id as string | undefined,
    type: req.query.type as string | undefined,
    author_id: req.query.author_id as string | undefined,
    since: req.query.since as string | undefined,
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

router.get('/:id/edits', async (req: AuthenticatedRequest, res: Response) => {
  const edits = await postService.getPostEdits(req.params.id, req.auth!.orgId);
  if (edits === null) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
    return;
  }
  res.json({ success: true, data: edits });
});

router.get('/:id/reactions', async (req: AuthenticatedRequest, res: Response) => {
  const reactions = await reactionService.getReactions(req.params.id, req.auth!.orgId);
  if (reactions === null) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
    return;
  }
  res.json({ success: true, data: reactions });
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const post = await postService.getPost(req.params.id, req.auth!.orgId);
  if (!post) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
    return;
  }
  res.json({ success: true, data: post });
});

router.patch('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const body = editPostSchema.parse(req.body);
    const result = await postService.editPost(req.params.id, req.auth!.orgId, req.auth!.id, body);
    if (result === null) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
      return;
    }
    if (result && 'forbidden' in result) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only edit your own posts' } });
      return;
    }
    res.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    next(err);
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const result = await postService.deletePost(req.params.id, req.auth!.orgId, req.auth!.id);
  if (result === null) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
    return;
  }
  if (typeof result === 'object' && 'forbidden' in result) {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only delete your own posts' } });
    return;
  }
  res.json({ success: true, data: { deleted: true } });
});

router.post('/:id/reactions', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const body = addReactionSchema.parse(req.body);
    const reaction = await reactionService.addReaction(
      req.auth!.orgId,
      req.params.id,
      req.auth!.id,
      req.auth!.type,
      body.emoji,
    );
    if (!reaction) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
      return;
    }
    res.status(201).json({ success: true, data: reaction });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    next(err);
  }
});

router.delete('/:id/reactions/:emoji', async (req: AuthenticatedRequest, res: Response) => {
  const removed = await reactionService.removeReaction(
    req.auth!.orgId,
    req.params.id,
    req.auth!.id,
    req.params.emoji,
  );
  res.json({ success: true, data: { removed } });
});

export default router;
