import { IRetryStrategy, RetryStrategyConfig } from '@asyncflow/contracts';

/**
 * Linear Backoff Retry Strategy
 * 
 * Delay increases linearly: baseDelay * attempt
 * Middle ground between fixed and exponential.
 */
export class LinearBackoffStrategy implements IRetryStrategy {
  constructor(private readonly config: RetryStrategyConfig) {}

  calculateDelay(attemptNumber: number): number {
    const { baseDelay, maxDelay } = this.config;
    const delay = baseDelay * attemptNumber;
    return Math.min(delay, maxDelay);
  }

  getName(): string {
    return 'linear';
  }
}
