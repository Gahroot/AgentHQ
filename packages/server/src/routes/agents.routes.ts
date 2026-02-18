import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../auth/middleware';
import { agentService } from '../modules/agents/agent.service';
import { mentionService } from '../modules/mentions/mention.service';
import { parsePagination, buildPaginationResult } from '../utils/pagination';

const router = Router();

const searchAgentsSchema = z.object({
  q: z.string().optional(),
  capabilities: z.string().optional(),
  status: z.enum(['online', 'offline', 'busy']).optional(),
});

const updateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const heartbeatSchema = z.object({
  status: z.enum(['online', 'offline', 'busy']).optional(),
});

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const { limit, offset, page } = parsePagination(req);
  const { agents, total } = await agentService.listAgents(req.auth!.orgId, limit, offset);
  res.json({
    success: true,
    data: agents,
    pagination: buildPaginationResult(page, limit, total),
  });
});

router.get('/search', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const params = searchAgentsSchema.parse({
      q: req.query.q,
      capabilities: req.query.capabilities,
      status: req.query.status,
    });

    const { limit, offset, page } = parsePagination(req);

    const capabilities = params.capabilities ? params.capabilities.split(',').map((c) => c.trim()) : undefined;
    const filters: { capabilities?: string[]; status?: string[] } = {};
    if (capabilities && capabilities.length > 0) {
      filters.capabilities = capabilities;
    }
    if (params.status) {
      filters.status = [params.status];
    }

    const { agents, total } = await agentService.searchAgents(req.auth!.orgId, params.q, filters, limit, offset);
    res.json({
      success: true,
      data: agents,
      pagination: buildPaginationResult(page, limit, total),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    next(err);
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const agent = await agentService.getAgent(req.params.id, req.auth!.orgId);
  if (!agent) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Agent not found' } });
    return;
  }
  res.json({ success: true, data: agent });
});

router.patch('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const body = updateAgentSchema.parse(req.body);
    const agent = await agentService.updateAgent(req.params.id, req.auth!.orgId, body);
    if (!agent) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Agent not found' } });
      return;
    }
    res.json({ success: true, data: agent });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    next(err);
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const deleted = await agentService.deleteAgent(req.params.id, req.auth!.orgId);
  if (!deleted) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Agent not found' } });
    return;
  }
  res.json({ success: true, data: { deleted: true } });
});

router.post('/:id/heartbeat', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const body = heartbeatSchema.parse(req.body);
    await agentService.heartbeat(req.params.id, req.auth!.orgId, body.status);
    res.json({ success: true, data: { ok: true } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    next(err);
  }
});

router.get('/:id/mentions', async (req: AuthenticatedRequest, res: Response) => {
  const { limit, offset, page } = parsePagination(req);
  const { mentions, total } = await mentionService.getMentionsForAgent(req.params.id, req.auth!.orgId, limit, offset);
  res.json({ success: true, data: mentions, pagination: buildPaginationResult(page, limit, total) });
});

export default router;
