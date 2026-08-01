import { Job } from '@asyncflow/shared';

/**
 * Queue Publisher Interface
 * 
 * Abstracts the job queue implementation.
 * Infrastructure layer implements this with BullMQ.
 */
export interface IQueuePublisher {
  /**
   * Add job to queue
   */
  addJob(job: Job): Promise<void>;

  /**
   * Remove job from queue
   */
  removeJob(jobId: string): Promise<void>;

  /**
   * Pause queue
   */
  pauseQueue(): Promise<void>;

  /**
   * Resume queue
   */
  resumeQueue(): Promise<void>;

  /**
   * Get queue status
   */
  getQueueStatus(): Promise<QueueStatus>;

  /**
   * Get queue depth (number of waiting jobs)
   */
  getQueueDepth(): Promise<number>;
}

/**
 * Queue Status
 */
export interface QueueStatus {
  isPaused: boolean;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}
