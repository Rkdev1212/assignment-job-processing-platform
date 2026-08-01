import { JobStatus, isValidTransition } from './job-status.enum';
import { DomainEvent } from '../events/domain-event';
import {
  JobCreatedEvent,
  JobStartedEvent,
  JobCompletedEvent,
  JobFailedEvent,
  JobRetriedEvent,
  JobMovedToDeadLetterEvent,
  JobCancelledEvent,
} from '../events/job.events';

/**
 * Job Entity - Rich Domain Model
 * 
 * Encapsulates all business logic related to job lifecycle.
 * Enforces state machine transitions and emits domain events.
 */
export class Job {
  private _domainEvents: DomainEvent[] = [];

  constructor(
    public readonly id: string,
    public readonly type: string,
    public readonly payload: Record<string, any>,
    private _status: JobStatus,
    private _priority: number,
    private _attempts: number,
    private _maxAttempts: number,
    public readonly delay: number,
    public readonly runAt: Date | null,
    private _workerId: string | null,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    private _startedAt: Date | null,
    private _completedAt: Date | null,
    private _executionTime: number | null,
    private _lastError: string | null,
    public readonly correlationId: string,
  ) {}

  // Getters
  get status(): JobStatus {
    return this._status;
  }

  get priority(): number {
    return this._priority;
  }

  get attempts(): number {
    return this._attempts;
  }

  get maxAttempts(): number {
    return this._maxAttempts;
  }

  get workerId(): string | null {
    return this._workerId;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get startedAt(): Date | null {
    return this._startedAt;
  }

  get completedAt(): Date | null {
    return this._completedAt;
  }

  get executionTime(): number | null {
    return this._executionTime;
  }

  get lastError(): string | null {
    return this._lastError;
  }

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Factory method to create a new job
   */
  static create(
    id: string,
    type: string,
    payload: Record<string, any>,
    priority: number = 0,
    maxAttempts: number = 3,
    delay: number = 0,
    runAt: Date | null = null,
    correlationId: string,
  ): Job {
    const now = new Date();
    const job = new Job(
      id,
      type,
      payload,
      JobStatus.QUEUED,
      priority,
      0,
      maxAttempts,
      delay,
      runAt,
      null,
      now,
      now,
      null,
      null,
      null,
      null,
      correlationId,
    );

    job.addDomainEvent(
      new JobCreatedEvent(id, type, payload, priority, delay, runAt, correlationId),
    );

    return job;
  }

  /**
   * Mark job as started
   */
  markStarted(workerId: string): void {
    this.validateTransition(JobStatus.PROCESSING);
    this._status = JobStatus.PROCESSING;
    this._workerId = workerId;
    this._startedAt = new Date();
    this._updatedAt = new Date();

    this.addDomainEvent(new JobStartedEvent(this.id, workerId, this._startedAt));
  }

  /**
   * Mark job as completed
   */
  markCompleted(): void {
    this.validateTransition(JobStatus.COMPLETED);
    this._status = JobStatus.COMPLETED;
    this._completedAt = new Date();
    this._executionTime = this._startedAt
      ? this._completedAt.getTime() - this._startedAt.getTime()
      : null;
    this._updatedAt = new Date();

    this.addDomainEvent(new JobCompletedEvent(this.id, this._completedAt, this._executionTime));
  }

  /**
   * Mark job as failed
   */
  markFailed(error: string): void {
    this.validateTransition(JobStatus.FAILED);
    this._status = JobStatus.FAILED;
    this._lastError = error;
    this._updatedAt = new Date();

    this.addDomainEvent(new JobFailedEvent(this.id, error, this._attempts));
  }

  /**
   * Retry the job
   */
  retry(): void {
    if (this._attempts >= this._maxAttempts) {
      throw new Error(`Job ${this.id} has exceeded max attempts (${this._maxAttempts})`);
    }

    this.validateTransition(JobStatus.RETRYING);
    this._status = JobStatus.RETRYING;
    this._attempts += 1;
    this._updatedAt = new Date();
    this._workerId = null;

    this.addDomainEvent(new JobRetriedEvent(this.id, this._attempts, this._maxAttempts));
  }

  /**
   * Move job to dead letter queue
   */
  moveToDeadLetter(): void {
    this.validateTransition(JobStatus.DEAD_LETTER);
    this._status = JobStatus.DEAD_LETTER;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new JobMovedToDeadLetterEvent(this.id, this._lastError || 'Unknown error', this._attempts),
    );
  }

  /**
   * Cancel the job
   */
  cancel(): void {
    if (this._status === JobStatus.COMPLETED || this._status === JobStatus.DEAD_LETTER) {
      throw new Error(`Cannot cancel job in ${this._status} state`);
    }

    this._status = JobStatus.CANCELLED;
    this._updatedAt = new Date();

    this.addDomainEvent(new JobCancelledEvent(this.id, new Date()));
  }

  /**
   * Validate state transition
   */
  private validateTransition(toStatus: JobStatus): void {
    if (!isValidTransition(this._status, toStatus)) {
      throw new Error(`Invalid state transition from ${this._status} to ${toStatus}`);
    }
  }

  /**
   * Add domain event
   */
  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Clear domain events (after publishing)
   */
  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Check if job can be retried
   */
  canRetry(): boolean {
    return this._attempts < this._maxAttempts && this._status === JobStatus.FAILED;
  }

  /**
   * Check if job is in final state
   */
  isFinalState(): boolean {
    return [JobStatus.COMPLETED, JobStatus.DEAD_LETTER, JobStatus.CANCELLED].includes(
      this._status,
    );
  }

  /**
   * Serialize to plain object
   */
  toObject() {
    return {
      id: this.id,
      type: this.type,
      payload: this.payload,
      status: this._status,
      priority: this._priority,
      attempts: this._attempts,
      maxAttempts: this._maxAttempts,
      delay: this.delay,
      runAt: this.runAt,
      workerId: this._workerId,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
      startedAt: this._startedAt,
      completedAt: this._completedAt,
      executionTime: this._executionTime,
      lastError: this._lastError,
      correlationId: this.correlationId,
    };
  }
}
