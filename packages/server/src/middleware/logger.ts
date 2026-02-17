import pino from 'pino';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export const logger = pino({
  level: config.logLevel,
  transport: config.env === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: Date.now() - start,
    });
  });
  next();
}
