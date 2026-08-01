import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Configuration Service
 * 
 * Centralized configuration management with validation.
 */
export class ConfigService {
  private static instance: ConfigService;

  private constructor() {
    this.validateConfig();
  }

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Get configuration value
   */
  get(key: string, defaultValue?: string): string {
    return process.env[key] || defaultValue || '';
  }

  /**
   * Get required configuration value
   */
  getRequired(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required configuration: ${key}`);
    }
    return value;
  }

  /**
   * Get number configuration
   */
  getNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    return value ? parseInt(value, 10) : defaultValue;
  }

  /**
   * Get boolean configuration
   */
  getBoolean(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    return value ? value === 'true' : defaultValue;
  }

  /**
   * Application configuration
   */
  get app() {
    return {
      nodeEnv: this.get('NODE_ENV', 'development'),
      port: this.getNumber('PORT', 3000),
      apiPrefix: this.get('API_PREFIX', 'api/v1'),
    };
  }

  /**
   * Database configuration
   */
  get database() {
    return {
      url: this.getRequired('DATABASE_URL'),
    };
  }

  /**
   * Redis configuration
   */
  get redis() {
    return {
      host: this.get('REDIS_HOST', 'localhost'),
      port: this.getNumber('REDIS_PORT', 6379),
      password: this.get('REDIS_PASSWORD', ''),
      db: this.getNumber('REDIS_DB', 0),
    };
  }

  /**
   * Queue configuration
   */
  get queue() {
    return {
      name: this.get('QUEUE_NAME', 'asyncflow-jobs'),
      concurrency: this.getNumber('QUEUE_CONCURRENCY', 5),
      maxAttempts: this.getNumber('QUEUE_MAX_ATTEMPTS', 3),
    };
  }

  /**
   * JWT configuration
   */
  get jwt() {
    return {
      secret: this.getRequired('JWT_SECRET'),
      expiration: this.get('JWT_EXPIRATION', '24h'),
    };
  }

  /**
   * Rate limiting configuration
   */
  get rateLimit() {
    return {
      ttl: this.getNumber('RATE_LIMIT_TTL', 60),
      max: this.getNumber('RATE_LIMIT_MAX', 100),
    };
  }

  /**
   * Logging configuration
   */
  get logging() {
    return {
      level: this.get('LOG_LEVEL', 'info'),
      pretty: this.getBoolean('LOG_PRETTY', true),
    };
  }

  /**
   * Metrics configuration
   */
  get metrics() {
    return {
      enabled: this.getBoolean('METRICS_ENABLED', true),
    };
  }

  /**
   * Worker configuration
   */
  get worker() {
    return {
      id: this.get('WORKER_ID', `worker-${Date.now()}`),
      heartbeatInterval: this.getNumber('WORKER_HEARTBEAT_INTERVAL', 30000),
      gracefulShutdownTimeout: this.getNumber('WORKER_GRACEFUL_SHUTDOWN_TIMEOUT', 30000),
    };
  }

  /**
   * Retry strategy configuration
   */
  get retry() {
    return {
      strategy: this.get('RETRY_STRATEGY', 'exponential'),
      baseDelay: this.getNumber('RETRY_BASE_DELAY', 1000),
      maxDelay: this.getNumber('RETRY_MAX_DELAY', 60000),
      multiplier: this.getNumber('RETRY_MULTIPLIER', 2),
    };
  }

  /**
   * Validate required configuration
   */
  private validateConfig(): void {
    const required = ['DATABASE_URL', 'JWT_SECRET'];

    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.app.nodeEnv === 'production';
  }

  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return this.app.nodeEnv === 'development';
  }

  /**
   * Check if running in test
   */
  isTest(): boolean {
    return this.app.nodeEnv === 'test';
  }
}
