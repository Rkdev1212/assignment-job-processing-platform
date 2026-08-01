/**
 * Logger Interface
 * 
 * Abstracts logging implementation.
 */
export interface ILogger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
}

/**
 * Log Context
 */
export interface LogContext {
  requestId?: string;
  correlationId?: string;
  jobId?: string;
  workerId?: string;
  duration?: number;
  [key: string]: any;
}
