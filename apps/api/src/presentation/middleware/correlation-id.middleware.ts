import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { IdGenerator } from '@asyncflow/utils';

/**
 * Correlation ID Middleware
 * 
 * Adds correlation ID to every request.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId =
      (req.headers['x-correlation-id'] as string) || IdGenerator.generateCorrelationId();

    req['correlationId'] = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);

    next();
  }
}
