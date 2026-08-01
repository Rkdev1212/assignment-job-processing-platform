/**
 * Retry Strategy Interface
 * 
 * Defines contract for retry delay calculation.
 * Implements Strategy Pattern.
 */
export interface IRetryStrategy {
  /**
   * Calculate delay for next retry attempt
   * 
   * @param attemptNumber - Current attempt number (1-based)
   * @returns Delay in milliseconds
   */
  calculateDelay(attemptNumber: number): number;

  /**
   * Get strategy name
   */
  getName(): string;
}

/**
 * Retry Strategy Configuration
 */
export interface RetryStrategyConfig {
  baseDelay: number;
  maxDelay: number;
  multiplier?: number;
}
