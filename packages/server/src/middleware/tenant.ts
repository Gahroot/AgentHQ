import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/middleware';

export function tenantMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.auth?.orgId) {
    res.status(400).json({
      success: false,
      error: { code: 'MISSING_ORG', message: 'Organization context required' },
    });
    return;
  }
  next();
}
