import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule} from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

// Infrastructure
import { PrismaService } from '@asyncflow/database';
import { BullMQQueuePublisher } from '@asyncflow/queue';
import { RedisFactory } from '@asyncflow/queue';
import { PinoLoggerService } from '@asyncflow/logger';
import { PrometheusMetricsService } from '@asyncflow/metrics';
import { ConfigService } from '@asyncflow/config';

// Repositories
import { PrismaJobRepository } from './infrastructure/repositories/prisma-job.repository';

// Services
import { JobService } from './application/services/job.service';

// Controllers
import { JobController } from './presentation/controllers/job.controller';
import { QueueController } from './presentation/controllers/queue.controller';
import { MetricsController } from './presentation/controllers/metrics.controller';
import { HealthController } from './presentation/controllers/health.controller';

// Middleware & Filters
import { CorrelationIdMiddleware } from './presentation/middleware/correlation-id.middleware';
import { RequestLoggerMiddleware } from './presentation/middleware/request-logger.middleware';
import { HttpExceptionFilter } from './presentation/filters/http-exception.filter';

// Auth
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';

// Contracts - not imported, will use string tokens instead
// import { IJobRepository, IQueuePublisher, ILogger, IMetricsCollector } from '@asyncflow/contracts';

// Dependency Injection Tokens
export const LOGGER_TOKEN = 'ILogger';
export const METRICS_COLLECTOR_TOKEN = 'IMetricsCollector';
export const QUEUE_PUBLISHER_TOKEN = 'IQueuePublisher';
export const JOB_REPOSITORY_TOKEN = 'IJobRepository';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.jwt.secret,
        signOptions: { expiresIn: config.jwt.expiration },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      useFactory: (config: ConfigService) => [
        {
          ttl: config.rateLimit.ttl * 1000,
          limit: config.rateLimit.max,
        },
      ],
      inject: [ConfigService],
    }),
  ],
  controllers: [
    JobController,
    QueueController,
    MetricsController,
    HealthController,
  ],
  providers: [
    // Config
    {
      provide: ConfigService,
      useValue: ConfigService.getInstance(),
    },
    
    // Database
    PrismaService,

    // Redis
    {
      provide: 'Redis',
      useFactory: (config: ConfigService) => {
        return RedisFactory.create(config.redis);
      },
      inject: [ConfigService],
    },

    // Logger
    {
      provide: LOGGER_TOKEN,
      useFactory: () => new PinoLoggerService('AsyncFlowAPI'),
    },

    // Metrics
    {
      provide: METRICS_COLLECTOR_TOKEN,
      useClass: PrometheusMetricsService,
    },

    // Queue
    {
      provide: QUEUE_PUBLISHER_TOKEN,
      useFactory: (config: ConfigService, redis: any) => {
        return new BullMQQueuePublisher(config.queue.name, redis);
      },
      inject: [ConfigService, 'Redis'],
    },

    // Repository
    {
      provide: JOB_REPOSITORY_TOKEN,
      useClass: PrismaJobRepository,
    },

    // Services
    JobService,

    // Auth
    JwtStrategy,

    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware, RequestLoggerMiddleware)
      .forRoutes('*');
  }
}
