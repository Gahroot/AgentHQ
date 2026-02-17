import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parsePagination, buildPaginationResult } from './pagination';

describe('pagination utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parsePagination', () => {
    it('returns default values when no query params provided', () => {
      const req = { query: {} } as any;
      const result = parsePagination(req);
      expect(result).toEqual({ page: 1, limit: 20, offset: 0 });
    });

    it('parses custom page and limit', () => {
      const req = { query: { page: '3', limit: '50' } } as any;
      const result = parsePagination(req);
      expect(result).toEqual({ page: 3, limit: 50, offset: 100 });
    });

    it('clamps page to minimum of 1', () => {
      const req = { query: { page: '0' } } as any;
      const result = parsePagination(req);
      expect(result.page).toBe(1);
    });

    it('clamps page to minimum of 1 for negative values', () => {
      const req = { query: { page: '-5' } } as any;
      const result = parsePagination(req);
      expect(result.page).toBe(1);
    });

    it('clamps limit to minimum of 1', () => {
      // parseInt('0') is 0 which is falsy, so || 20 kicks in, resulting in 20.
      // The min clamp of 1 only applies after the fallback.
      // Testing with an explicit low value that parseInt parses as a number:
      const req = { query: { limit: '0' } } as any;
      const result = parsePagination(req);
      // 0 is falsy so the fallback to 20 applies; Math.max(1, 20) = 20
      expect(result.limit).toBe(20);
    });

    it('clamps limit to minimum of 1 for negative values', () => {
      const req = { query: { limit: '-10' } } as any;
      const result = parsePagination(req);
      expect(result.limit).toBe(1);
    });

    it('clamps limit to maximum of 100', () => {
      const req = { query: { limit: '500' } } as any;
      const result = parsePagination(req);
      expect(result.limit).toBe(100);
    });

    it('calculates offset correctly', () => {
      const req = { query: { page: '5', limit: '10' } } as any;
      const result = parsePagination(req);
      expect(result.offset).toBe(40);
    });

    it('handles non-numeric query params gracefully', () => {
      const req = { query: { page: 'abc', limit: 'xyz' } } as any;
      const result = parsePagination(req);
      expect(result).toEqual({ page: 1, limit: 20, offset: 0 });
    });
  });

  describe('buildPaginationResult', () => {
    it('returns correct page, limit, and total', () => {
      const result = buildPaginationResult(2, 10, 50);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(50);
    });

    it('hasMore is true when more pages exist', () => {
      const result = buildPaginationResult(1, 10, 50);
      expect(result.hasMore).toBe(true);
    });

    it('hasMore is false on the last page', () => {
      const result = buildPaginationResult(5, 10, 50);
      expect(result.hasMore).toBe(false);
    });

    it('hasMore is false when total is 0', () => {
      const result = buildPaginationResult(1, 10, 0);
      expect(result.hasMore).toBe(false);
    });

    it('hasMore is false when page exceeds total pages', () => {
      const result = buildPaginationResult(10, 10, 50);
      expect(result.hasMore).toBe(false);
    });

    it('hasMore is true on second-to-last page', () => {
      const result = buildPaginationResult(4, 10, 50);
      expect(result.hasMore).toBe(true);
    });
  });
});
