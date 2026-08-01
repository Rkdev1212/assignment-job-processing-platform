import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '@asyncflow/database';
import { IQueuePublisher } from '@asyncflow/contracts';
import { Redis } from 'ioredis';

/**
 * Health Controller
 * 
 * Provides health check endpoints.
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queuePublisher: IQueuePublisher,
    private readonly redis: Redis,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    const startTime = Date.now();

    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkQueue(),
    ]);

    const [database, redis, queue] = checks.map((check) =>
      check.status === 'fulfilled' ? check.value : { status: 'unhealthy', error: check.reason },
    );

    const responseTime = Date.now() - startTime;
    const isHealthy = database.status === 'healthy' && redis.status === 'healthy' && queue.status === 'healthy';

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      checks: {
        database,
        redis,
        queue,
      },
    };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  private async checkRedis() {
    try {
      await this.redis.ping();
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  private async checkQueue() {
    try {
      const queueStatus = await this.queuePublisher.getQueueStatus();
      return {
        status: 'healthy',
        isPaused: queueStatus.isPaused,
        waiting: queueStatus.waiting,
        active: queueStatus.active,
      };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}
