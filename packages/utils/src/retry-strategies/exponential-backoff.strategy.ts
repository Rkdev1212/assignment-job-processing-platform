import { IRetryStrategy, RetryStrategyConfig } from '@asyncflow/contracts';

/**
 * Exponential Backoff Retry Strategy
 * 
 * Delay increases exponentially: baseDelay * (multiplier ^ attempt)
 * Commonly used for distributed systems to avoid thundering herd.
 */
export class ExponentialBackoffStrategy implements IRetryStrategy {
  constructor(private readonly config: RetryStrategyConfig) {}

  calculateDelay(attemptNumber: number): number {
    const { baseDelay, maxDelay, multiplier = 2 } = this.config;
    const delay = baseDelay * Math.pow(multiplier, attemptNumber - 1);
    return Math.min(delay, maxDelay);
  }

  getName(): string {
    return 'exponential';
  }
}
