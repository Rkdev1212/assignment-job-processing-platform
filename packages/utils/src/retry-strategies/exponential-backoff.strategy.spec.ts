import { ExponentialBackoffStrategy } from './exponential-backoff.strategy';

describe('ExponentialBackoffStrategy', () => {
  it('should calculate delay with exponential backoff', () => {
    const strategy = new ExponentialBackoffStrategy({
      baseDelay: 1000,
      maxDelay: 60000,
      multiplier: 2,
    });

    expect(strategy.calculateDelay(1)).toBe(1000);  // 1000 * 2^0
    expect(strategy.calculateDelay(2)).toBe(2000);  // 1000 * 2^1
    expect(strategy.calculateDelay(3)).toBe(4000);  // 1000 * 2^2
    expect(strategy.calculateDelay(4)).toBe(8000);  // 1000 * 2^3
    expect(strategy.calculateDelay(5)).toBe(16000); // 1000 * 2^4
  });

  it('should cap delay at maxDelay', () => {
    const strategy = new ExponentialBackoffStrategy({
      baseDelay: 1000,
      maxDelay: 10000,
      multiplier: 2,
    });

    expect(strategy.calculateDelay(10)).toBe(10000); // Would be 512000, capped at 10000
  });

  it('should return strategy name', () => {
    const strategy = new ExponentialBackoffStrategy({
      baseDelay: 1000,
      maxDelay: 60000,
    });

    expect(strategy.getName()).toBe('exponential');
  });
});
