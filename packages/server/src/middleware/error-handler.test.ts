import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { AppError, errorHandler } from './error-handler';

describe('AppError', () => {
  it('creates an error with correct statusCode, code, and message', () => {
    const err = new AppError(404, 'NOT_FOUND', 'Resource not found');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Resource not found');
    expect(err.name).toBe('AppError');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('errorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createMocks() {
    const req = {} as unknown as Request;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;
    return { req, res, next };
  }

  it('handles AppError with correct status and JSON response', () => {
    const { req, res, next } = createMocks();
    const err = new AppError(422, 'VALIDATION_ERROR', 'Invalid input');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
    });
  });

  it('handles generic Error with 500 status', () => {
    const { req, res, next } = createMocks();
    const err = new Error('Something went wrong');

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  });

  it('does not expose internal error details for generic errors', () => {
    const { req, res, next } = createMocks();
    const err = new Error('DB connection failed');

    errorHandler(err, req, res, next);

    const responseBody = vi.mocked(res.json).mock.calls[0][0];
    expect(responseBody.error.message).not.toContain('DB connection failed');
  });
});
