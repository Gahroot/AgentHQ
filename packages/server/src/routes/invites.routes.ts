import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { AuthenticatedRequest, requireRole } from '../auth/middleware';
import { inviteService } from '../modules/invites/invite.service';
import { parsePagination, buildPaginationResult } from '../utils/pagination';

// --- Public: Redeem Router (no auth) ---

export const redeemRouter = Router();

const redeemLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many attempts, please try again later' },
  },
});

// Agent invite redemption (existing)
const agentRedeemSchema = z.object({
  token: z.string().min(1),
  agentName: z.string().min(1).max(100),
});

redeemRouter.post('/redeem', redeemLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = agentRedeemSchema.parse(req.body);
    const result = await inviteService.redeemAgentInvite(body.token, body.agentName);

    if ('error' in result && result.error) {
      const { error } = result;
      const statusCode = error.code === 'INVALID_TOKEN' ? 404
        : error.code === 'TOKEN_ALREADY_USED' ? 409
        : error.code === 'TOKEN_EXPIRED' ? 410
        : error.code === 'INVALID_INVITE_TYPE' ? 400
        : 400;
      res.status(statusCode).json({ success: false, error });
      return;
    }

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    next(err);
  }
});

// User invite redemption (new)
const userRedeemSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1).max(100),
  password: z.string().min(8),
});

redeemRouter.post('/redeem-user', redeemLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = userRedeemSchema.parse(req.body);
    const result = await inviteService.redeemUserInvite(body.token, body.name, body.password);

    if ('error' in result && result.error) {
      const { error } = result;
      const statusCode = error.code === 'INVALID_TOKEN' ? 404
        : error.code === 'TOKEN_ALREADY_USED' ? 409
        : error.code === 'TOKEN_EXPIRED' ? 410
        : error.code === 'INVALID_INVITE_TYPE' ? 400
        : error.code === 'EMAIL_EXISTS' ? 409
        : 400;
      res.status(statusCode).json({ success: false, error });
      return;
    }

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    next(err);
  }
});

// Get invite details by token (for the invite acceptance page)
redeemRouter.get('/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await inviteService.getInviteByToken(req.params.token);

    if ('error' in result && result.error) {
      const { error } = result;
      const statusCode = error.code === 'INVALID_TOKEN' ? 404
        : error.code === 'TOKEN_EXPIRED' ? 410
        : 400;
      res.status(statusCode).json({ success: false, error });
      return;
    }

    res.json({ success: true, data: result.invite });
  } catch (err) {
    next(err);
  }
});

// --- Protected: Admin Invite Routes ---

export const inviteRoutes = Router();

inviteRoutes.use(requireRole('admin', 'owner'));

// Create agent invite (existing endpoint, now explicit)
inviteRoutes.post('/agent', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { invite, token } = await inviteService.createAgentInvite(req.auth!.orgId, req.auth!.id);
    res.status(201).json({ success: true, data: { invite, token } });
  } catch (err) {
    next(err);
  }
});

// Create user invite (new endpoint)
const createUserInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['viewer', 'member', 'admin']).optional(),
});

inviteRoutes.post('/user', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const body = createUserInviteSchema.parse(req.body);
    const result = await inviteService.createUserInvite(
      req.auth!.orgId,
      req.auth!.id,
      body.email,
      body.role || 'member',
    );

    if ('error' in result && result.error) {
      const { error } = result;
      const statusCode = error.code === 'USER_ALREADY_IN_ORG' ? 409 : 400;
      res.status(statusCode).json({ success: false, error });
      return;
    }

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    next(err);
  }
});

// List invites with optional type filter
inviteRoutes.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const { limit, offset, page } = parsePagination(req);
  const type = req.query.type as 'agent' | 'user' | undefined;
  const { invites, total } = await inviteService.listInvites(req.auth!.orgId, limit, offset, type);
  res.json({
    success: true,
    data: invites,
    pagination: buildPaginationResult(page, limit, total),
  });
});

// Revoke invite
inviteRoutes.post('/:id/revoke', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await inviteService.revokeInvite(req.params.id, req.auth!.orgId);

    if ('error' in result && result.error) {
      const { error } = result;
      const statusCode = error.code === 'NOT_FOUND' ? 404 : 400;
      res.status(statusCode).json({ success: false, error });
      return;
    }

    res.json({ success: true, data: result.invite });
  } catch (err) {
    next(err);
  }
});
