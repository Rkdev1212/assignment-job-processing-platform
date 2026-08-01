import { Redis } from 'ioredis';

/**
 * Redis Factory
 * 
 * Creates and manages Redis connections.
 */
export class RedisFactory {
  static create(config: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    tls?: boolean;
  }): Redis {
    const useTls = config.tls === true || config.port === 6380 || config.port === 443;

    return new Redis({
      host: config.host,
      port: config.port,
      password: config.password || undefined,
      db: config.db || 0,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 10000,
      ...(useTls && { tls: {} }),
      retryStrategy: (times: number) => {
        if (times > 5) return null;
        return Math.min(times * 200, 2000);
      },
    });
  }

  /**
   * Create a connection for BullMQ - no commandTimeout so blocking commands work
   */
  static createForBullMQ(config: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    tls?: boolean;
  }): Redis {
    const useTls = config.tls === true || config.port === 6380 || config.port === 443;

    return new Redis({
      host: config.host,
      port: config.port,
      password: config.password || undefined,
      db: config.db || 0,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 10000,
      ...(useTls && { tls: {} }),
      retryStrategy: (times: number) => {
        if (times > 5) return null;
        return Math.min(times * 200, 2000);
      },
    });
  }
}
