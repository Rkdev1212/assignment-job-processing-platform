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

    try {
      // Initialize Prisma
      const prisma = new PrismaService();
      await prisma.onModuleInit();
      logger.info('Database connected');

      // Initialize Redis
      const redisConfig = config.redis;
      logger.info('Connecting to Redis', { host: redisConfig.host, port: redisConfig.port, tls: redisConfig.tls });
      const redis = RedisFactory.create(redisConfig);
      await redis.ping();
      logger.info('Redis connected');

      // Separate connection for BullMQ (no commandTimeout - blocking commands need it)
      const bullMQRedis = RedisFactory.createForBullMQ(redisConfig);

      // Initialize components
      const jobRepository = new PrismaJobRepository(prisma);
      const metrics = new PrometheusMetricsService();
      
      const retryStrategy = RetryStrategyFactory.create(config.retry.strategy, {
        baseDelay: config.retry.baseDelay,
        maxDelay: config.retry.maxDelay,
        multiplier: config.retry.multiplier,
      });

      logger.info('Using retry strategy', { strategy: retryStrategy.getName() });

      // Start HTTP health server FIRST so Render detects the port immediately
      this.startHealthServer(config.app.port, logger);

      // Setup graceful shutdown
      this.setupGracefulShutdown(logger, prisma);

      // Create and start processor (non-blocking)
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

      logger.info('Worker is ready to process jobs');    } catch (error) {
      logger.error('Failed to start worker', error instanceof Error ? error : undefined);
      process.exit(1);
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
      if (this.isShuttingDown) {
        logger.warn('Shutdown already in progress');
        return;
      }

      this.isShuttingDown = true;

      logger.info(`${signal} received, shutting down gracefully`);

      try {
        if (this.processor) {
          logger.info('Stopping job processor');
          await this.processor.stop();
        }

        logger.info('Closing database connection');
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

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught exception', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled rejection', reason instanceof Error ? reason : undefined, {
        reason: String(reason),
      });
      shutdown('unhandledRejection');
    });
  }
}

// Start worker
const app = new WorkerApp();
app.start().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
