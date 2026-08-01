import { IRetryStrategy, RetryStrategyConfig } from '@asyncflow/contracts';
import { ExponentialBackoffStrategy } from './exponential-backoff.strategy';
import { FixedDelayStrategy } from './fixed-delay.strategy';
import { LinearBackoffStrategy } from './linear-backoff.strategy';

/**
 * Retry Strategy Factory
 * 
 * Creates retry strategy instances based on configuration.
 */
export class RetryStrategyFactory {
  static create(type: string, config: RetryStrategyConfig): IRetryStrategy {
    switch (type.toLowerCase()) {
      case 'exponential':
        return new ExponentialBackoffStrategy(config);
      case 'linear':
        return new LinearBackoffStrategy(config);
      case 'fixed':
        return new FixedDelayStrategy(config);
      default:
        throw new Error(`Unknown retry strategy: ${type}`);
    }
  }
}
