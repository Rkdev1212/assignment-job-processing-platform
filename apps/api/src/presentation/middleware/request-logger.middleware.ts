import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ILogger } from '@asyncflow/contracts';
import { LOGGER_TOKEN } from '../../injection-tokens';

/**
 * Request Logger Middleware
 * 
 * Logs all HTTP requests with correlation ID.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(@Inject(LOGGER_TOKEN) private readonly logger: ILogger) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const correlationId = req.correlationId;

    this.logger.info(`Incoming request`, {
      method,
      url: originalUrl,
      ip,
      correlationId,
    });

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      this.logger.info(`Request completed`, {
        method,
        url: originalUrl,
        statusCode,
        duration,
        correlationId,
      });
    });

    next();
  }
}
