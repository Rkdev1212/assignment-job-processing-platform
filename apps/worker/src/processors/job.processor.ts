import { Job as BullJob, Worker } from 'bullmq';
import { IJobRepository, ILogger, IMetricsCollector, IRetryStrategy } from '@asyncflow/contracts';
import { Job, JobStatus } from '@asyncflow/shared';
import { ConfigService } from '@asyncflow/config';

/**
 * Job Processor
 * 
 * Processes jobs from the queue.
 * Implements job lifecycle management and error handling.
 */
export class JobProcessor {
  private worker: Worker;
  private readonly workerId: string;

  constructor(
    private readonly config: ConfigService,
    private readonly jobRepository: IJobRepository,
    private readonly logger: ILogger,
    private readonly metrics: IMetricsCollector,
    private readonly retryStrategy: IRetryStrategy,
    redis: any,
  ) {
    this.workerId = config.worker.id;

    this.worker = new Worker(
      config.queue.name,
      async (bullJob: BullJob) => {
        return this.processJob(bullJob);
      },
      {
        connection: redis,
        concurrency: config.queue.concurrency,
        autorun: false,
      },
    );

    this.setupEventHandlers();
  }

  /**
   * Start worker
   */
  async start(): Promise<void> {
    this.logger.info('Starting worker', { workerId: this.workerId });
    await this.worker.run();
    this.logger.info('Worker started successfully', { workerId: this.workerId });
  }

  /**
   * Stop worker gracefully
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping worker', { workerId: this.workerId });
    await this.worker.close();
    this.logger.info('Worker stopped', { workerId: this.workerId });
  }

  /**
   * Process a single job
   */
  private async processJob(bullJob: BullJob): Promise<void> {
    const { jobId, type, payload, correlationId } = bullJob.data;

    this.logger.info('Processing job', {
      jobId,
      type,
      workerId: this.workerId,
      correlationId,
    });

    const startTime = Date.now();

    try {
      // Fetch job from database
      const job = await this.jobRepository.findById(jobId);

      if (!job) {
        throw new Error(`Job ${jobId} not found in database`);
      }

      // Mark job as started
      job.markStarted(this.workerId);
      await this.jobRepository.update(job);

      // Simulate job processing (In real implementation, this would call actual job handlers)
      await this.executeJob(type, payload);

      // Mark job as completed
      job.markCompleted();
      await this.jobRepository.update(job);

      const duration = Date.now() - startTime;

      this.logger.info('Job completed successfully', {
        jobId,
        duration,
        workerId: this.workerId,
        correlationId,
      });

      // Update metrics
      this.metrics.incrementCounter('jobs_completed_total');
      this.metrics.recordHistogram('job_processing_time_seconds', duration / 1000);
    } catch (error) {
      await this.handleJobFailure(jobId, error, correlationId, startTime);
      throw error; // Re-throw to let BullMQ handle retries
    }
  }

  /**
   * Execute job based on type
   */
  private async executeJob(type: string, payload: any): Promise<void> {
    // In a real implementation, this would route to different handlers based on job type
    // For now, we'll simulate processing with a delay
    
    this.logger.debug('Executing job', { type, payload });

    // Simulate async work
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500));

    // Simulate occasional failures (10% chance)
    if (Math.random() < 0.1) {
      throw new Error(`Simulated failure for job type: ${type}`);
    }

    this.logger.debug('Job execution completed', { type });
  }

  /**
   * Handle job failure
   */
  private async handleJobFailure(
    jobId: string,
    error: any,
    correlationId: string,
    startTime: number,
  ): Promise<void> {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    this.logger.error('Job failed', error instanceof Error ? error : undefined, {
      jobId,
      error: errorMessage,
      duration,
      workerId: this.workerId,
      correlationId,
    });

    try {
      const job = await this.jobRepository.findById(jobId);

      if (!job) {
        this.logger.error('Cannot handle failure: job not found', undefined, { jobId });
        return;
      }

      job.markFailed(errorMessage);

      if (job.canRetry()) {
        job.retry();
        await this.jobRepository.update(job);

        const retryDelay = this.retryStrategy.calculateDelay(job.attempts);

        this.logger.info('Job will be retried', {
          jobId,
          attempts: job.attempts,
          maxAttempts: job.maxAttempts,
          retryDelay,
          correlationId,
        });

        this.metrics.incrementCounter('jobs_retry_total');
      } else {
        job.moveToDeadLetter();
        await this.jobRepository.update(job);

        this.logger.warn('Job moved to dead letter queue', {
          jobId,
          attempts: job.attempts,
          error: errorMessage,
          correlationId,
        });

        this.metrics.incrementCounter('dead_letter_jobs');
      }

      this.metrics.incrementCounter('jobs_failed_total');
    } catch (handlingError) {
      this.logger.error('Error handling job failure', handlingError instanceof Error ? handlingError : undefined, {
        jobId,
        originalError: errorMessage,
      });
    }
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.worker.on('completed', (job: BullJob) => {
      this.logger.debug('BullMQ job completed', { jobId: job.id });
    });

    this.worker.on('failed', (job: BullJob | undefined, error: Error) => {
      this.logger.error('BullMQ job failed', error, { jobId: job?.id });
    });

    this.worker.on('error', (error: Error) => {
      this.logger.error('Worker error', error, { workerId: this.workerId });
    });

    this.worker.on('stalled', (jobId: string) => {
      this.logger.warn('Job stalled', { jobId, workerId: this.workerId });
    });
  }

  /**
   * Get worker stats
   */
  async getStats() {
    return {
      workerId: this.workerId,
      isRunning: await this.worker.isRunning(),
    };
  }
}
