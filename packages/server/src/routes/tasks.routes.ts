import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../auth/middleware';
import { taskService } from '../modules/tasks/task.service';
import { notificationService } from '../modules/notifications/notification.service';
import { parsePagination, buildPaginationResult } from '../utils/pagination';
import { broadcastToOrg } from '../websocket/index';
import { logger } from '../middleware/logger';

const router = Router();

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigned_to: z.string().optional(),
  assigned_type: z.string().optional(),
  channel_id: z.string().optional(),
  due_date: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assigned_to: z.string().optional(),
  assigned_type: z.string().optional(),
  channel_id: z.string().optional(),
  due_date: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

router.post('/', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const body = createTaskSchema.parse(req.body);
    const task = await taskService.createTask(req.auth!.orgId, {
      ...body,
      created_by: req.auth!.id,
      created_by_type: req.auth!.type,
    });

    broadcastToOrg(req.auth!.orgId, 'task:new', { task: task as unknown as Record<string, unknown> });

    if (body.assigned_to && body.assigned_type) {
      notificationService.notifyTaskAssignment(
        req.auth!.orgId,
        body.assigned_to,
        body.assigned_type,
        req.auth!.id,
        req.auth!.type,
        task.id,
        task.title,
      ).catch(err => logger.error({ err }, 'Failed to send task assignment notification'));
    }

    res.status(201).json({ success: true, data: task });
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
    status: req.query.status as string | undefined,
    priority: req.query.priority as string | undefined,
    assigned_to: req.query.assigned_to as string | undefined,
    created_by: req.query.created_by as string | undefined,
    channel_id: req.query.channel_id as string | undefined,
  };
  const { tasks, total } = await taskService.listTasks(req.auth!.orgId, filters, limit, offset);
  res.json({
    success: true,
    data: tasks,
    pagination: buildPaginationResult(page, limit, total),
  });
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const task = await taskService.getTask(req.params.id, req.auth!.orgId);
  if (!task) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } });
    return;
  }
  res.json({ success: true, data: task });
});

router.patch('/:id', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const body = updateTaskSchema.parse(req.body);
    const existingTask = await taskService.getTask(req.params.id, req.auth!.orgId);
    if (!existingTask) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } });
      return;
    }

    const task = await taskService.updateTask(req.params.id, req.auth!.orgId, body);

    broadcastToOrg(req.auth!.orgId, 'task:updated', { task: task as unknown as Record<string, unknown> });

    if (body.assigned_to && body.assigned_type && body.assigned_to !== existingTask.assigned_to) {
      notificationService.notifyTaskAssignment(
        req.auth!.orgId,
        body.assigned_to,
        body.assigned_type,
        req.auth!.id,
        req.auth!.type,
        req.params.id,
        task?.title || existingTask.title,
      ).catch(err => logger.error({ err }, 'Failed to send task assignment notification'));
    }

    res.json({ success: true, data: task });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    next(err);
  }
});

router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const deleted = await taskService.deleteTask(req.params.id, req.auth!.orgId);
  if (!deleted) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } });
    return;
  }
  res.json({ success: true, data: { deleted: true } });
});

export default router;
