import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../auth/middleware';
import { orgService } from '../modules/orgs/org.service';
import { requireRole } from '../auth/middleware';

const router = Router();

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const org = await orgService.getOrg(req.auth!.orgId);
  if (!org) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Organization not found' } });
    return;
  }
  res.json({ success: true, data: org });
});

router.patch('/', requireRole('owner', 'admin'), async (req: AuthenticatedRequest, res: Response) => {
  const org = await orgService.updateOrg(req.auth!.orgId, req.body);
  res.json({ success: true, data: org });
});

export default router;
