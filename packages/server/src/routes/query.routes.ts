import { Router, Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../auth/middleware';
import { postService } from '../modules/posts/post.service';

const router = Router();

const querySchema = z.object({
  question: z.string().min(1),
  context: z.record(z.any()).optional(),
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = querySchema.parse(req.body);

    // For now, query is implemented as full-text search
    // In production, this would route to an LLM with hub context
    const { posts } = await postService.searchPosts(req.auth!.orgId, body.question, 10, 0);

    res.json({
      success: true,
      data: {
        question: body.question,
        answer: `Found ${posts.length} relevant posts for your query.`,
        sources: posts.map((p) => ({ id: p.id, title: p.title, content: p.content.substring(0, 200) })),
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    throw err;
  }
});

export default router;
