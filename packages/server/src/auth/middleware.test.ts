import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('./jwt', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('./api-keys', () => ({
  validateApiKey: vi.fn(),
}));

import { authMiddleware, requireRole, AuthenticatedRequest } from './middleware';
import { verifyToken } from './jwt';
import { validateApiKey } from './api-keys';
import { Response, NextFunction } from 'express';

function createMocks() {
  const req = { headers: {}, auth: undefined } as unknown as AuthenticatedRequest;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next };
}

describe('authMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no authorization header is present', async () => {
    const { req, res, next } = createMocks();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when authorization header does not start with Bearer', async () => {
    const { req, res, next } = createMocks();
    req.headers.authorization = 'Basic some-token';

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('handles Bearer JWT token successfully', async () => {
    const { req, res, next } = createMocks();
    req.headers.authorization = 'Bearer some-jwt-token';

    vi.mocked(verifyToken).mockReturnValue({
      sub: 'user-1',
      org_id: 'org-1',
      role: 'admin',
      type: 'access',
    });

    await authMiddleware(req, res, next);

    expect(verifyToken).toHaveBeenCalledWith('some-jwt-token');
    expect(req.auth).toEqual({
      type: 'user',
      id: 'user-1',
      orgId: 'org-1',
      role: 'admin',
    });
    expect(next).toHaveBeenCalled();
  });

  it('returns 401 when JWT is not an access token', async () => {
    const { req, res, next } = createMocks();
    req.headers.authorization = 'Bearer some-refresh-token';

    vi.mocked(verifyToken).mockReturnValue({
      sub: 'user-1',
      org_id: 'org-1',
      role: 'admin',
      type: 'refresh',
    });

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Not an access token' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('handles API key auth successfully', async () => {
    const { req, res, next } = createMocks();
    req.headers.authorization = 'Bearer ahq_valid-api-key';

    vi.mocked(validateApiKey).mockResolvedValue({
      agentId: 'agent-1',
      orgId: 'org-1',
    });

    await authMiddleware(req, res, next);

    expect(validateApiKey).toHaveBeenCalledWith('ahq_valid-api-key');
    expect(req.auth).toEqual({
      type: 'agent',
      id: 'agent-1',
      orgId: 'org-1',
    });
    expect(next).toHaveBeenCalled();
  });

  it('returns 401 for invalid API key', async () => {
    const { req, res, next } = createMocks();
    req.headers.authorization = 'Bearer ahq_invalid-key';

    vi.mocked(validateApiKey).mockResolvedValue(null);

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'INVALID_API_KEY', message: 'Invalid API key' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when JWT verification throws', async () => {
    const { req, res, next } = createMocks();
    req.headers.authorization = 'Bearer bad-jwt-token';

    vi.mocked(verifyToken).mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
    });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('requireRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when req.auth is missing', () => {
    const { req, res, next } = createMocks();
    req.auth = undefined;

    const middleware = requireRole('admin');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows a user with a matching role', () => {
    const { req, res, next } = createMocks();
    req.auth = { type: 'user', id: 'user-1', orgId: 'org-1', role: 'admin' };

    const middleware = requireRole('admin', 'owner');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('denies a user with a non-matching role', () => {
    const { req, res, next } = createMocks();
    req.auth = { type: 'user', id: 'user-1', orgId: 'org-1', role: 'member' };

    const middleware = requireRole('admin');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('allows agents to bypass role check', () => {
    const { req, res, next } = createMocks();
    req.auth = { type: 'agent', id: 'agent-1', orgId: 'org-1' };

    const middleware = requireRole('admin');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('denies a user with no role set', () => {
    const { req, res, next } = createMocks();
    req.auth = { type: 'user', id: 'user-1', orgId: 'org-1' };

    const middleware = requireRole('admin');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
