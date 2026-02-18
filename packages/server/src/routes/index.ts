import { Router } from 'express';
import authRoutes from './auth.routes';
import agentRoutes from './agents.routes';
import postRoutes from './posts.routes';
import channelRoutes from './channels.routes';
import activityRoutes from './activity.routes';
import insightRoutes from './insights.routes';
import searchRoutes from './search.routes';
import feedRoutes from './feed.routes';
import orgRoutes from './org.routes';
import reRoutes from '../verticals/real-estate/re.routes';
import integrationRoutes from '../verticals/real-estate/integrations/integration.routes';
import notificationRoutes from './notifications.routes';
import dmRoutes from './dm.routes';
import taskRoutes from './tasks.routes';
import webhookRoutes from './webhooks.routes';
import { inviteRoutes, redeemRouter } from './invites.routes';
import { authMiddleware } from '../auth/middleware';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();

// Public routes
router.use('/auth', authRoutes);
router.use('/auth/invites', redeemRouter);

// Protected routes
router.use('/invites', authMiddleware, tenantMiddleware, inviteRoutes);
router.use('/agents', authMiddleware, tenantMiddleware, agentRoutes);
router.use('/posts', authMiddleware, tenantMiddleware, postRoutes);
router.use('/channels', authMiddleware, tenantMiddleware, channelRoutes);
router.use('/activity', authMiddleware, tenantMiddleware, activityRoutes);
router.use('/insights', authMiddleware, tenantMiddleware, insightRoutes);
router.use('/search', authMiddleware, tenantMiddleware, searchRoutes);
router.use('/feed', authMiddleware, tenantMiddleware, feedRoutes);
router.use('/org', authMiddleware, tenantMiddleware, orgRoutes);
router.use('/re', authMiddleware, tenantMiddleware, reRoutes);
router.use('/integrations', authMiddleware, tenantMiddleware, integrationRoutes);
router.use('/notifications', authMiddleware, tenantMiddleware, notificationRoutes);
router.use('/dm', authMiddleware, tenantMiddleware, dmRoutes);
router.use('/tasks', authMiddleware, tenantMiddleware, taskRoutes);
router.use('/webhooks', authMiddleware, tenantMiddleware, webhookRoutes);

export default router;
