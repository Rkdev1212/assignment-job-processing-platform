import { IJobRepository, JobFilters, PaginatedResult, PaginationParams } from '@asyncflow/contracts';
import { Job, JobStatus } from '@asyncflow/shared';
import { PrismaService } from '@asyncflow/database';

/**
 * Prisma Job Repository (Worker Version)
 * 
 * Same implementation as API repository.
 * In a real-world scenario, this would be shared from a common package.
 */
export class PrismaJobRepository implements IJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(job: Job): Promise<Job> {
    const jobData = job.toObject();
    
    await this.prisma.job.create({
      data: {
        id: jobData.id,
        type: jobData.type,
        payload: jobData.payload,
        status: jobData.status,
        priority: jobData.priority,
        attempts: jobData.attempts,
        maxAttempts: jobData.maxAttempts,
        delay: jobData.delay,
        runAt: jobData.runAt,
        workerId: jobData.workerId,
        createdAt: jobData.createdAt,
        updatedAt: jobData.updatedAt,
        startedAt: jobData.startedAt,
        completedAt: jobData.completedAt,
        executionTime: jobData.executionTime,
        lastError: jobData.lastError,
        correlationId: jobData.correlationId,
        timeline: {
          create: {
            previousStatus: null,
            newStatus: jobData.status,
            metadata: { event: 'job_created' },
          },
        },
      },
    });

    return job;
  }

  async findById(id: string): Promise<Job | null> {
    const jobRecord = await this.prisma.job.findUnique({
      where: { id },
    });

    return jobRecord ? this.mapToDomain(jobRecord) : null;
  }

  async findMany(filters: JobFilters): Promise<PaginatedResult<Job>> {
    const { status, type, workerId, pagination, sorting } = filters;
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (workerId) where.workerId = workerId;

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: sorting
          ? { [sorting.sortBy]: sorting.order }
          : { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      data: jobs.map((job: any) => this.mapToDomain(job)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(job: Job): Promise<Job> {
    const jobData = job.toObject();
    const previousJob = await this.prisma.job.findUnique({
      where: { id: job.id },
    });

    await this.prisma.job.update({
      where: { id: job.id },
      data: {
        status: jobData.status,
        attempts: jobData.attempts,
        workerId: jobData.workerId,
        updatedAt: jobData.updatedAt,
        startedAt: jobData.startedAt,
        completedAt: jobData.completedAt,
        executionTime: jobData.executionTime,
        lastError: jobData.lastError,
        timeline: previousJob && previousJob.status !== jobData.status
          ? {
              create: {
                previousStatus: previousJob.status,
                newStatus: jobData.status,
                metadata: { event: 'status_changed' },
              },
            }
          : undefined,
      },
    });

    return job;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.job.delete({
      where: { id },
    });
  }

  async findDeadLetterJobs(pagination: PaginationParams): Promise<PaginatedResult<Job>> {
    return this.findMany({
      status: JobStatus.DEAD_LETTER,
      pagination,
    });
  }

  async countByStatus(status: JobStatus): Promise<number> {
    return this.prisma.job.count({
      where: { status },
    });
  }

  async getJobsForProcessing(limit: number): Promise<Job[]> {
    const jobs = await this.prisma.job.findMany({
      where: {
        status: {
          in: [JobStatus.QUEUED, JobStatus.RETRYING],
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: limit,
    });

    return jobs.map((job: any) => this.mapToDomain(job));
  }

  private mapToDomain(record: any): Job {
    return new Job(
      record.id,
      record.type,
      record.payload,
      record.status as JobStatus,
      record.priority,
      record.attempts,
      record.maxAttempts,
      record.delay,
      record.runAt,
      record.workerId,
      record.createdAt,
      record.updatedAt,
      record.startedAt,
      record.completedAt,
      record.executionTime,
      record.lastError,
      record.correlationId,
    );
  }
}
