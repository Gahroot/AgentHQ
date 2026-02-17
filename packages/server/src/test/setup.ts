import { vi } from 'vitest';

// Mock the database module globally
vi.mock('../config/database', () => ({
  getDb: vi.fn(),
  closeDb: vi.fn(),
}));

// Mock pino logger to suppress output during tests
vi.mock('../middleware/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn().mockReturnThis(),
  },
  requestLogger: vi.fn((_req: any, _res: any, next: any) => next()),
}));
