import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { webhookService } from '../modules/webhooks/webhook.service';
import { AuthenticatedRequest } from '../auth/middleware';

const router = Router();

// Schema validation
const createWebhookSchema = z.object({
  url: z.string().url('Invalid URL format'),
  events: z.array(z.enum(['notification:new', 'post:created', 'post:reply', 'task:assigned'])).min(1, 'At least one event required'),
  secret: z.string().optional(),
});

// POST /api/v1/webhooks - Create webhook
router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = req.auth?.orgId;
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const validated = createWebhookSchema.parse(req.body);
    const webhook = await webhookService.createWebhook(orgId, validated);

    res.status(201).json({
      id: webhook.id,
      url: webhook.url,
      events: webhook.events,
      active: webhook.active,
      created_at: webhook.created_at,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    next(error);
  }
});

// GET /api/v1/webhooks - List webhooks
router.get('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = req.auth?.orgId;
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const webhooks = await webhookService.listWebhooks(orgId);

    res.json({
      webhooks: webhooks.map((w) => ({
        id: w.id,
        url: w.url,
        events: w.events,
        active: w.active,
        created_at: w.created_at,
        has_secret: !!w.secret,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/webhooks/:id - Delete webhook
router.delete('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = req.auth?.orgId;
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const deleted = await webhookService.deleteWebhook(req.params.id, orgId);
    if (!deleted) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/webhooks/:id/test - Test ping
router.post('/:id/test', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const orgId = req.auth?.orgId;
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID required' });
    }

    const result = await webhookService.testWebhook(req.params.id, orgId);
    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Webhook not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
});

export default router;
