import { PrismaClient } from '@prisma/client';

/**
 * Prisma Service
 * 
 * Manages database connection lifecycle.
 */
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      await this.jobTimeline.deleteMany();
      await this.job.deleteMany();
    }
  }
}
