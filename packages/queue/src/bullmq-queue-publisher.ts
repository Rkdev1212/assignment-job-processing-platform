import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { IQueuePublisher, QueueStatus } from '@asyncflow/contracts';
import { Job } from '@asyncflow/shared';

/**
 * BullMQ Queue Publisher
 * 
 * Adapter that wraps BullMQ implementation.
 * Implements IQueuePublisher interface.
 */
export class BullMQQueuePublisher implements IQueuePublisher {
  private queue: Queue;

  constructor(
    queueName: string,
    private readonly redis: Redis,
  ) {
    this.queue = new Queue(queueName, {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          count: 100,
          age: 24 * 3600,
        },
        removeOnFail: {
          count: 1000,
          age: 7 * 24 * 3600,
        },
      },
    });
  }

  async addJob(job: Job): Promise<void> {
    await this.queue.add(
      job.type,
      {
        jobId: job.id,
        type: job.type,
        payload: job.payload,
        correlationId: job.correlationId,
      },
      {
        jobId: job.id,
        priority: job.priority,
        delay: job.delay,
        ...(job.runAt && {
          timestamp: job.runAt.getTime(),
        }),
        attempts: job.maxAttempts,
      },
    );
  }

  async removeJob(jobId: string): Promise<void> {
    const bullJob = await this.queue.getJob(jobId);
    if (bullJob) {
      await bullJob.remove();
    }
  }

  async pauseQueue(): Promise<void> {
    await this.queue.pause();
  }

  async resumeQueue(): Promise<void> {
    await this.queue.resume();
  }

  async getQueueStatus(): Promise<QueueStatus> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    const isPaused = await this.queue.isPaused();

    return {
      isPaused,
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  async getQueueDepth(): Promise<number> {
    return this.queue.getWaitingCount();
  }

  /**
   * Close queue connection
   */
  async close(): Promise<void> {
    await this.queue.close();
  }

  /**
   * Get underlying BullMQ queue (for worker)
   */
  getQueue(): Queue {
    return this.queue;
  }
}
