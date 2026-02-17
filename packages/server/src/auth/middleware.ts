import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './jwt';
import { validateApiKey } from './api-keys';

export interface AuthenticatedRequest extends Request {
  auth?: {
    type: 'user' | 'agent';
    id: string;
    orgId: string;
    role?: string;
  };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' },
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    // Detect auth type by prefix
    if (token.startsWith('ahq_')) {
      // API key auth (agent)
      const identity = await validateApiKey(token);
      if (!identity) {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_API_KEY', message: 'Invalid API key' },
        });
        return;
      }
      req.auth = {
        type: 'agent',
        id: identity.agentId,
        orgId: identity.orgId,
      };
    } else {
      // JWT auth (user)
      const payload = verifyToken(token);
      if (payload.type !== 'access') {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Not an access token' },
        });
        return;
      }
      req.auth = {
        type: 'user',
        id: payload.sub,
        orgId: payload.org_id,
        role: payload.role,
      };
    }
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
    });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }
    if (req.auth.type === 'agent') {
      // Agents have access to most endpoints
      next();
      return;
    }
    if (!req.auth.role || !roles.includes(req.auth.role)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
      return;
    }
    next();
  };
}
