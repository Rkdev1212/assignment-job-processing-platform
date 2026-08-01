import { DomainEvent } from './domain-event';

/**
 * Job Created Event
 */
export class JobCreatedEvent extends DomainEvent {
  constructor(
    jobId: string,
    public readonly type: string,
    public readonly payload: Record<string, any>,
    public readonly priority: number,
    public readonly delay: number,
    public readonly runAt: Date | null,
    public readonly correlationId: string,
  ) {
    super('job.created', jobId);
  }

  toPayload(): Record<string, any> {
    return {
      jobId: this.aggregateId,
      type: this.type,
      payload: this.payload,
      priority: this.priority,
      delay: this.delay,
      runAt: this.runAt,
      correlationId: this.correlationId,
      occurredAt: this.occurredAt,
    };
  }
}

/**
 * Job Started Event
 */
export class JobStartedEvent extends DomainEvent {
  constructor(
    jobId: string,
    public readonly workerId: string,
    public readonly startedAt: Date,
  ) {
    super('job.started', jobId);
  }

  toPayload(): Record<string, any> {
    return {
      jobId: this.aggregateId,
      workerId: this.workerId,
      startedAt: this.startedAt,
      occurredAt: this.occurredAt,
    };
  }
}

/**
 * Job Completed Event
 */
export class JobCompletedEvent extends DomainEvent {
  constructor(
    jobId: string,
    public readonly completedAt: Date,
    public readonly executionTime: number | null,
  ) {
    super('job.completed', jobId);
  }

  toPayload(): Record<string, any> {
    return {
      jobId: this.aggregateId,
      completedAt: this.completedAt,
      executionTime: this.executionTime,
      occurredAt: this.occurredAt,
    };
  }
}

/**
 * Job Failed Event
 */
export class JobFailedEvent extends DomainEvent {
  constructor(
    jobId: string,
    public readonly error: string,
    public readonly attempts: number,
  ) {
    super('job.failed', jobId);
  }

  toPayload(): Record<string, any> {
    return {
      jobId: this.aggregateId,
      error: this.error,
      attempts: this.attempts,
      occurredAt: this.occurredAt,
    };
  }
}

/**
 * Job Retried Event
 */
export class JobRetriedEvent extends DomainEvent {
  constructor(
    jobId: string,
    public readonly attempts: number,
    public readonly maxAttempts: number,
  ) {
    super('job.retried', jobId);
  }

  toPayload(): Record<string, any> {
    return {
      jobId: this.aggregateId,
      attempts: this.attempts,
      maxAttempts: this.maxAttempts,
      occurredAt: this.occurredAt,
    };
  }
}

/**
 * Job Moved to Dead Letter Event
 */
export class JobMovedToDeadLetterEvent extends DomainEvent {
  constructor(
    jobId: string,
    public readonly reason: string,
    public readonly attempts: number,
  ) {
    super('job.moved_to_dead_letter', jobId);
  }

  toPayload(): Record<string, any> {
    return {
      jobId: this.aggregateId,
      reason: this.reason,
      attempts: this.attempts,
      occurredAt: this.occurredAt,
    };
  }
}

/**
 * Job Cancelled Event
 */
export class JobCancelledEvent extends DomainEvent {
  constructor(
    jobId: string,
    public readonly cancelledAt: Date,
  ) {
    super('job.cancelled', jobId);
  }

  toPayload(): Record<string, any> {
    return {
      jobId: this.aggregateId,
      cancelledAt: this.cancelledAt,
      occurredAt: this.occurredAt,
    };
  }
}
