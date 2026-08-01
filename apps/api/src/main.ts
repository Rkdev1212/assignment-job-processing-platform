import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@asyncflow/config';
import { PrismaService } from '@asyncflow/database';
import { ILogger } from '@asyncflow/contracts';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get configuration
  const configService = app.get(ConfigService);
  const logger = app.get<ILogger>(ILogger);

  // Enable CORS
  app.enableCors();

  // Global prefix
  app.setGlobalPrefix(configService.app.apiPrefix);

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('AsyncFlow API')
    .setDescription('A distributed-ready asynchronous job processing platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Jobs', 'Job management endpoints')
    .addTag('Queue', 'Queue control endpoints')
    .addTag('Metrics', 'Metrics and monitoring')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Prisma lifecycle
  const prismaService = app.get(PrismaService);
  await prismaService.onModuleInit();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await prismaService.onModuleDestroy();
    await app.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await prismaService.onModuleDestroy();
    await app.close();
    process.exit(0);
  });

  const port = configService.app.port;
  await app.listen(port);

  logger.info(`AsyncFlow API is running on: http://localhost:${port}/${configService.app.apiPrefix}`);
  logger.info(`Swagger documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
