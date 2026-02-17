import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { orgService } from '../modules/orgs/org.service';
import { agentService } from '../modules/agents/agent.service';
import { channelService } from '../modules/channels/channel.service';
import { generateId } from '../utils/id';
import { hashPassword, comparePassword } from '../utils/crypto';
import { signAccessToken, signRefreshToken, verifyToken } from '../auth/jwt';
import { getDb } from '../config/database';
import { authMiddleware, AuthenticatedRequest } from '../auth/middleware';

const router = Router();

const registerSchema = z.object({
  orgName: z.string().min(1),
  orgSlug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = registerSchema.parse(req.body);
    const db = getDb();

    // Check if org slug exists
    const existingOrg = await db('orgs').where('slug', body.orgSlug).first();
    if (existingOrg) {
      res.status(409).json({ success: false, error: { code: 'ORG_EXISTS', message: 'Organization slug already taken' } });
      return;
    }

    // Check if email exists
    const existingUser = await db('users').where('email', body.email).first();
    if (existingUser) {
      res.status(409).json({ success: false, error: { code: 'EMAIL_EXISTS', message: 'Email already registered' } });
      return;
    }

    // Create org
    const org = await orgService.createOrg(body.orgName, body.orgSlug);

    // Create default channels
    await channelService.createDefaultChannels(org.id);

    // Create owner user
    const userId = generateId();
    const passwordHash = await hashPassword(body.password);
    await db('users').insert({
      id: userId,
      org_id: org.id,
      email: body.email,
      password_hash: passwordHash,
      name: body.name,
      role: 'owner',
    });

    const accessToken = signAccessToken({ sub: userId, org_id: org.id, role: 'owner' });
    const refreshToken = signRefreshToken({ sub: userId, org_id: org.id, role: 'owner' });

    res.status(201).json({
      success: true,
      data: { org, user: { id: userId, email: body.email, name: body.name, role: 'owner' }, accessToken, refreshToken },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    next(err);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = loginSchema.parse(req.body);
    const db = getDb();

    const user = await db('users').where('email', body.email).first();
    if (!user || !(await comparePassword(body.password, user.password_hash))) {
      res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
      return;
    }

    const accessToken = signAccessToken({ sub: user.id, org_id: user.org_id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id, org_id: user.org_id, role: user.role });

    res.json({
      success: true,
      data: { user: { id: user.id, email: user.email, name: user.name, role: user.role, org_id: user.org_id }, accessToken, refreshToken },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    next(err);
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, error: { code: 'MISSING_TOKEN', message: 'Refresh token required' } });
      return;
    }

    const payload = verifyToken(refreshToken);
    if (payload.type !== 'refresh') {
      res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Not a refresh token' } });
      return;
    }

    const accessToken = signAccessToken({ sub: payload.sub, org_id: payload.org_id, role: payload.role });
    res.json({ success: true, data: { accessToken } });
  } catch {
    res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' } });
  }
});

const agentRegisterSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

router.post('/agents/register', authMiddleware, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.auth?.type !== 'user') {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only users can register agents' } });
      return;
    }

    const body = agentRegisterSchema.parse(req.body);
    const result = await agentService.registerAgent(req.auth.orgId, body.name, body.description, req.auth.id);

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors[0].message } });
      return;
    }
    next(err);
  }
});

export default router;
