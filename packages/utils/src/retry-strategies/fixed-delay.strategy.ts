import { IRetryStrategy, RetryStrategyConfig } from '@asyncflow/contracts';

/**
 * Fixed Delay Retry Strategy
 * 
 * Constant delay between retries.
 * Simple but can cause issues under high load.
 */
export class FixedDelayStrategy implements IRetryStrategy {
  constructor(private readonly config: RetryStrategyConfig) {}

  calculateDelay(_attemptNumber: number): number {
    return this.config.baseDelay;
  }

  getName(): string {
    return 'fixed';
  }
}
