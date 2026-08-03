import { ConfigService } from '@asyncflow/config';
import { PrismaService } from '@asyncflow/database';
import { RedisFactory } from '@asyncflow/queue';
import { PinoLoggerService } from '@asyncflow/logger';
import { PrometheusMetricsService } from '@asyncflow/metrics';
import { PrismaJobRepository } from './infrastructure/prisma-job.repository';
import { JobProcessor } from './processors/job.processor';
import { RetryStrategyFactory } from '@asyncflow/utils';
import * as http from 'http';

/**
 * Worker Application Entry Point
 */
class WorkerApp {
  private processor: JobProcessor | null = null;
  private isShuttingDown = false;
  private isReady = false;

  async start() {
    const config = ConfigService.getInstance();
    const logger = new PinoLoggerService('AsyncFlowWorker');

    logger.info('Starting AsyncFlow Worker', {
      workerId: config.worker.id,
      concurrency: config.queue.concurrency,
      environment: config.app.nodeEnv,
    });

    // Start health server immediately so Render detects the port
    this.startHealthServer(config.app.port, logger);

    // Initialize Prisma
    let prisma: PrismaService;
    try {
      prisma = new PrismaService();
      await prisma.onModuleInit();
      logger.info('Database connected');
    } catch (err) {
      logger.error('Database connection failed', err instanceof Error ? err : undefined);
      process.exit(1);
      return;
    }

    this.setupGracefulShutdown(logger, prisma);

    // Connect Redis with retry — don't crash if Upstash is rate-limited
    const redisConfig = config.redis;
    logger.info('Connecting to Redis', { host: redisConfig.host, port: redisConfig.port });

    const redis = RedisFactory.create(redisConfig);
    const bullMQRedis = RedisFactory.createForBullMQ(redisConfig);
    redis.on('error', () => {});
    bullMQRedis.on('error', () => {});

    await this.waitForRedis(redis, logger);

    // Initialize components
    const jobRepository = new PrismaJobRepository(prisma!);
    const metrics = new PrometheusMetricsService();
    const retryStrategy = RetryStrategyFactory.create(config.retry.strategy, {
      baseDelay: config.retry.baseDelay,
      maxDelay: config.retry.maxDelay,
      multiplier: config.retry.multiplier,
    });

    logger.info('Using retry strategy', { strategy: retryStrategy.getName() });

    this.processor = new JobProcessor(
      config,
      jobRepository,
      logger,
      metrics,
      retryStrategy,
      bullMQRedis,
    );

    await this.processor.start();
    this.isReady = true;
    logger.info('Worker is ready to process jobs');
  }

  /**
   * Wait for Redis to become available, retrying indefinitely with backoff.
   * This handles Upstash rate limit resets without crashing.
   */
  private async waitForRedis(redis: ReturnType<typeof RedisFactory.create>, logger: PinoLoggerService): Promise<void> {
    let attempt = 0;
    while (true) {
      try {
        await redis.ping();
        logger.info('Redis connected');
        return;
      } catch (err) {
        attempt++;
        const delay = Math.min(attempt * 10000, 60000); // 10s, 20s, ... max 60s
        logger.warn(`Redis not available (attempt ${attempt}), retrying in ${delay / 1000}s`, {
          error: err instanceof Error ? err.message : String(err),
        });
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  private startHealthServer(port: number, logger: PinoLoggerService) {
    const server = http.createServer((req, res) => {
      if (req.url === '/health' || req.url === '/') {
        const status = this.isReady ? 200 : 503;
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: this.isReady ? 'healthy' : 'starting',
          worker: 'AsyncFlowWorker',
          timestamp: new Date().toISOString(),
        }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(port, () => {
      logger.info(`Worker health server listening on port ${port}`);
    });
  }

  private setupGracefulShutdown(logger: PinoLoggerService, prisma: PrismaService) {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;
      logger.info(`${signal} received, shutting down gracefully`);
      try {
        if (this.processor) await this.processor.stop();
        await prisma.onModuleDestroy();
        logger.info('Worker shutdown complete');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', error instanceof Error ? error : undefined);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('uncaughtException', (error: Error) => { logger.error('Uncaught exception', error); shutdown('uncaughtException'); });
    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled rejection', reason instanceof Error ? reason : undefined, { reason: String(reason) });
      shutdown('unhandledRejection');
    });
  }
}

const app = new WorkerApp();
app.start().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
