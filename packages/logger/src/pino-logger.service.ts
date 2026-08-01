import pino, { Logger as PinoLogger } from 'pino';
import { ILogger, LogContext } from '@asyncflow/contracts';

/**
 * Pino Logger Service
 * 
 * Implementation of ILogger using Pino for structured logging.
 */
export class PinoLoggerService implements ILogger {
  private logger: PinoLogger;

  constructor(private readonly serviceName: string) {
    this.logger = pino({
      name: serviceName,
      level: process.env.LOG_LEVEL || 'info',
      ...(process.env.LOG_PRETTY === 'true' && process.env.NODE_ENV !== 'production'
        ? {
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            },
          }
        : {}),
    });
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(this.enrichContext(context), message);
  }

  info(message: string, context?: LogContext): void {
    this.logger.info(this.enrichContext(context), message);
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(this.enrichContext(context), message);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const enrichedContext = this.enrichContext(context);
    if (error) {
      this.logger.error({ ...enrichedContext, err: error }, message);
    } else {
      this.logger.error(enrichedContext, message);
    }
  }

  /**
   * Enrich context with additional metadata
   */
  private enrichContext(context?: LogContext): Record<string, any> {
    return {
      ...context,
      timestamp: new Date().toISOString(),
      service: this.serviceName,
    };
  }

  /**
   * Create child logger with additional context
   */
  child(context: LogContext): PinoLoggerService {
    const childLogger = new PinoLoggerService(this.serviceName);
    childLogger.logger = this.logger.child(context);
    return childLogger;
  }
}
