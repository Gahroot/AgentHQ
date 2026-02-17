import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../config', () => ({
  config: {
    jwt: {
      secret: 'test-secret-key-for-testing',
      expiresIn: '15m',
      refreshExpiresIn: '7d',
    },
  },
}));

import { signAccessToken, signRefreshToken, verifyToken } from './jwt';

describe('JWT utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signAccessToken', () => {
    it('returns a string token', () => {
      const token = signAccessToken({ sub: 'user-1', org_id: 'org-1', role: 'admin' });
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('produces a token with correct payload fields', () => {
      const token = signAccessToken({ sub: 'user-1', org_id: 'org-1', role: 'admin' });
      const payload = verifyToken(token);
      expect(payload.sub).toBe('user-1');
      expect(payload.org_id).toBe('org-1');
      expect(payload.role).toBe('admin');
      expect(payload.type).toBe('access');
    });
  });

  describe('signRefreshToken', () => {
    it('returns a string token', () => {
      const token = signRefreshToken({ sub: 'user-2', org_id: 'org-2', role: 'member' });
      expect(typeof token).toBe('string');
    });

    it('produces a token with type=refresh', () => {
      const token = signRefreshToken({ sub: 'user-2', org_id: 'org-2', role: 'member' });
      const payload = verifyToken(token);
      expect(payload.type).toBe('refresh');
      expect(payload.sub).toBe('user-2');
      expect(payload.org_id).toBe('org-2');
      expect(payload.role).toBe('member');
    });
  });

  describe('verifyToken', () => {
    it('successfully verifies a signed token', () => {
      const token = signAccessToken({ sub: 'user-3', org_id: 'org-3', role: 'admin' });
      const payload = verifyToken(token);
      expect(payload.sub).toBe('user-3');
      expect(payload.org_id).toBe('org-3');
      expect(payload.role).toBe('admin');
      expect(payload.type).toBe('access');
    });

    it('throws an error for an invalid token', () => {
      expect(() => verifyToken('invalid.token.string')).toThrow();
    });

    it('throws an error for a tampered token', () => {
      const token = signAccessToken({ sub: 'user-1', org_id: 'org-1', role: 'admin' });
      const tampered = token.slice(0, -5) + 'XXXXX';
      expect(() => verifyToken(tampered)).toThrow();
    });
  });
});
