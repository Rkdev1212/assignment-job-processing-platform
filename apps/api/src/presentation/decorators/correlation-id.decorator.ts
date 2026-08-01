import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Correlation ID Decorator
 * 
 * Extracts correlation ID from request headers.
 */
export const CorrelationId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.correlationId || request.headers['x-correlation-id'] || '';
  },
);
