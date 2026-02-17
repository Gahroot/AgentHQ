import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tenantMiddleware } from './tenant';

describe('tenantMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createMocks() {
    const req = { auth: {} } as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as any;
    const next = vi.fn();
    return { req, res, next };
  }

  it('returns 400 when req.auth.orgId is missing', () => {
    const { req, res, next } = createMocks();
    req.auth = {};

    tenantMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'MISSING_ORG', message: 'Organization context required' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 when req.auth is undefined', () => {
    const { req, res, next } = createMocks();
    req.auth = undefined;

    tenantMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when orgId is present', () => {
    const { req, res, next } = createMocks();
    req.auth = { orgId: 'org-123' };

    tenantMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
