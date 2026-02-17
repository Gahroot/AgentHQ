import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  hashPassword,
  comparePassword,
  generateApiKey,
  getApiKeyPrefix,
  hashApiKey,
  compareApiKey,
} from './crypto';

describe('crypto utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hashPassword / comparePassword', () => {
    it('hashes a password and verifies it matches', async () => {
      const password = 'my-secret-password';
      const hash = await hashPassword(password);
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);

      const isMatch = await comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it('rejects a wrong password', async () => {
      const hash = await hashPassword('correct-password');
      const isMatch = await comparePassword('wrong-password', hash);
      expect(isMatch).toBe(false);
    });
  });

  describe('generateApiKey', () => {
    it('starts with ahq_ prefix', () => {
      const key = generateApiKey();
      expect(key.startsWith('ahq_')).toBe(true);
    });

    it('has a reasonable length', () => {
      const key = generateApiKey();
      // ahq_ (4 chars) + 32 bytes base64url (~43 chars) = ~47 chars
      expect(key.length).toBeGreaterThan(20);
    });

    it('generates unique keys', () => {
      const keys = new Set<string>();
      for (let i = 0; i < 50; i++) {
        keys.add(generateApiKey());
      }
      expect(keys.size).toBe(50);
    });
  });

  describe('getApiKeyPrefix', () => {
    it('returns the first 12 characters', () => {
      const key = 'ahq_abcdefghijklmnop';
      const prefix = getApiKeyPrefix(key);
      expect(prefix).toBe('ahq_abcdefgh');
      expect(prefix).toHaveLength(12);
    });
  });

  describe('hashApiKey / compareApiKey', () => {
    it('hashes an API key and verifies it matches', async () => {
      const apiKey = generateApiKey();
      const hash = await hashApiKey(apiKey);
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(apiKey);

      const isMatch = await compareApiKey(apiKey, hash);
      expect(isMatch).toBe(true);
    });

    it('rejects a mismatched API key', async () => {
      const apiKey = generateApiKey();
      const hash = await hashApiKey(apiKey);

      const differentKey = generateApiKey();
      const isMatch = await compareApiKey(differentKey, hash);
      expect(isMatch).toBe(false);
    });
  });
});
