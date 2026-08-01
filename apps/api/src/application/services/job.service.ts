import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { IJobRepository, IQueuePublisher, ILogger, IMetricsCollector } from '@asyncflow/contracts';
import { Job, JobStatus } from '@asyncflow/shared';
import { IdGenerator } from '@asyncflow/utils';
import { CreateJobDto } from '../../presentation/dtos/create-job.dto';
import { JobQueryDto } from '../../presentation/dtos/job-query.dto';
import {
  LOGGER_TOKEN,
  METRICS_COLLECTOR_TOKEN,
  QUEUE_PUBLISHER_TOKEN,
  JOB_REPOSITORY_TOKEN,
} from '../../injection-tokens';

/**
 * Job Service
 * 
 * Application layer service for job management.
 * Orchestrates business logic and coordinates between repositories and queue.
 */
@Injectable()
export class JobService {
  constructor(
    @Inject(JOB_REPOSITORY_TOKEN) private readonly jobRepository: IJobRepository,
    @Inject(QUEUE_PUBLISHER_TOKEN) private readonly queuePublisher: IQueuePublisher,
    @Inject(LOGGER_TOKEN) private readonly logger: ILogger,
    @Inject(METRICS_COLLECTOR_TOKEN) private readonly metrics: IMetricsCollector,
  ) {}

  /**
   * Create a new job
   */
  async createJob(dto: CreateJobDto, correlationId: string): Promise<Job> {
    const jobId = IdGenerator.generateJobId();

    this.logger.info('Creating new job', {
      jobId,
      type: dto.type,
      correlationId,
    });

    const job = Job.create(
      jobId,
      dto.type,
      dto.payload,
      dto.priority || 0,
      dto.maxAttempts || 3,
      dto.delay || 0,
      dto.runAt || null,
      correlationId,
    );

    // Persist job
    await this.jobRepository.create(job);

    // Add to queue
    await this.queuePublisher.addJob(job);

    // Update metrics
    this.metrics.incrementCounter('jobs_processed_total');

    this.logger.info('Job created successfully', {
      jobId,
      correlationId,
    });

    return job;
  }

  /**
   * Get job by ID
   */
  async getJobById(id: string): Promise<Job> {
    const job = await this.jobRepository.findById(id);

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    return job;
  }

  /**
   * List jobs with filters and pagination
   */
  async listJobs(query: JobQueryDto) {
    const filters = {
      status: query.status,
      type: query.type,
      pagination: {
        page: query.page || 1,
        limit: query.limit || 10,
      },
      sorting: {
        sortBy: query.sortBy || 'createdAt',
        order: query.order || 'desc',
      },
    };

    return this.jobRepository.findMany(filters);
  }

  /**
   * Cancel a job
   */
  async cancelJob(id: string): Promise<Job> {
    const job = await this.getJobById(id);

    this.logger.info('Cancelling job', { jobId: id });

    job.cancel();

    await this.jobRepository.update(job);
    await this.queuePublisher.removeJob(id);

    this.logger.info('Job cancelled successfully', { jobId: id });

    return job;
  }

  /**
   * Get dead letter jobs
   */
  async getDeadLetterJobs(page: number = 1, limit: number = 10) {
    return this.jobRepository.findDeadLetterJobs({ page, limit });
  }

  /**
   * Pause queue
   */
  async pauseQueue(): Promise<void> {
    this.logger.info('Pausing queue');
    await this.queuePublisher.pauseQueue();
    this.logger.info('Queue paused');
  }

  /**
   * Resume queue
   */
  async resumeQueue(): Promise<void> {
    this.logger.info('Resuming queue');
    await this.queuePublisher.resumeQueue();
    this.logger.info('Queue resumed');
  }

  /**
   * Get queue status
   */
  async getQueueStatus() {
    return this.queuePublisher.getQueueStatus();
  }

  /**
   * Get job statistics
   */
  async getJobStatistics() {
    const [queued, processing, completed, failed, deadLetter] = await Promise.all([
      this.jobRepository.countByStatus(JobStatus.QUEUED),
      this.jobRepository.countByStatus(JobStatus.PROCESSING),
      this.jobRepository.countByStatus(JobStatus.COMPLETED),
      this.jobRepository.countByStatus(JobStatus.FAILED),
      this.jobRepository.countByStatus(JobStatus.DEAD_LETTER),
    ]);

    return {
      queued,
      processing,
      completed,
      failed,
      deadLetter,
      total: queued + processing + completed + failed + deadLetter,
    };
  }
}
