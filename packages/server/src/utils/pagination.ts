import { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export function parsePagination(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function buildPaginationResult(page: number, limit: number, total: number): PaginationResult {
  return {
    page,
    limit,
    total,
    hasMore: page * limit < total,
  };
}
