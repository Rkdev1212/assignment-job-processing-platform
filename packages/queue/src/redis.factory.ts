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
  }): Redis {
    return new Redis({
      host: config.host,
      port: config.port,
      password: config.password || undefined,
      db: config.db || 0,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
  }
}
