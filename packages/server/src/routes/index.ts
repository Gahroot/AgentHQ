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
import { authMiddleware } from '../auth/middleware';
import { tenantMiddleware } from '../middleware/tenant';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
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

export default router;
