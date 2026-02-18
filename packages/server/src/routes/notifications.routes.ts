import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../auth/middleware';
import { notificationService } from '../modules/notifications/notification.service';
import { parsePagination, buildPaginationResult } from '../utils/pagination';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const { limit, offset, page } = parsePagination(req);
  const filters: { type?: string; read?: boolean } = {};
  if (req.query.type) filters.type = req.query.type as string;
  if (req.query.read !== undefined) filters.read = req.query.read === 'true';
  const { notifications, total } = await notificationService.listNotifications(
    req.auth!.id,
    req.auth!.orgId,
    filters,
    limit,
    offset,
  );
  res.json({
    success: true,
    data: notifications,
    pagination: buildPaginationResult(page, limit, total),
  });
});

router.get('/unread-count', async (req: AuthenticatedRequest, res: Response) => {
  const count = await notificationService.getUnreadCount(req.auth!.id, req.auth!.orgId);
  res.json({ success: true, data: { count } });
});

router.patch('/:id/read', async (req: AuthenticatedRequest, res: Response) => {
  const updated = await notificationService.markRead(req.params.id, req.auth!.orgId, req.auth!.id);
  if (!updated) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } });
    return;
  }
  res.json({ success: true, data: { read: true } });
});

router.post('/read-all', async (req: AuthenticatedRequest, res: Response) => {
  await notificationService.markAllRead(req.auth!.id, req.auth!.orgId);
  res.json({ success: true, data: { read: true } });
});

export default router;
