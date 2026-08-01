import { Job, JobStatus } from './job.entity';

describe('Job Entity', () => {
  describe('create', () => {
    it('should create a job with QUEUED status', () => {
      const job = Job.create(
        'job-1',
        'email.send',
        { to: 'test@example.com' },
        1,
        3,
        0,
        null,
        'corr-1',
      );

      expect(job.id).toBe('job-1');
      expect(job.type).toBe('email.send');
      expect(job.status).toBe(JobStatus.QUEUED);
      expect(job.attempts).toBe(0);
      expect(job.domainEvents).toHaveLength(1);
    });
  });

  describe('markStarted', () => {
    it('should transition from QUEUED to PROCESSING', () => {
      const job = Job.create('job-1', 'test', {}, 0, 3, 0, null, 'corr-1');
      
      job.markStarted('worker-1');

      expect(job.status).toBe(JobStatus.PROCESSING);
      expect(job.workerId).toBe('worker-1');
      expect(job.startedAt).toBeTruthy();
    });

    it('should throw error for invalid state transition', () => {
      const job = Job.create('job-1', 'test', {}, 0, 3, 0, null, 'corr-1');
      job.markStarted('worker-1');
      job.markCompleted();

      expect(() => job.markStarted('worker-2')).toThrow();
    });
  });

  describe('markCompleted', () => {
    it('should transition from PROCESSING to COMPLETED', () => {
      const job = Job.create('job-1', 'test', {}, 0, 3, 0, null, 'corr-1');
      job.markStarted('worker-1');
      
      job.markCompleted();

      expect(job.status).toBe(JobStatus.COMPLETED);
      expect(job.completedAt).toBeTruthy();
      expect(job.executionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('retry', () => {
    it('should increment attempts and transition to RETRYING', () => {
      const job = Job.create('job-1', 'test', {}, 0, 3, 0, null, 'corr-1');
      job.markStarted('worker-1');
      job.markFailed('Connection timeout');

      job.retry();

      expect(job.status).toBe(JobStatus.RETRYING);
      expect(job.attempts).toBe(1);
    });

    it('should throw error when max attempts exceeded', () => {
      const job = Job.create('job-1', 'test', {}, 0, 2, 0, null, 'corr-1');
      job.markStarted('worker-1');
      job.markFailed('Error 1');
      job.retry();
      job.markFailed('Error 2');
      job.retry();

      expect(() => job.retry()).toThrow(/exceeded max attempts/);
    });
  });

  describe('moveToDeadLetter', () => {
    it('should transition from FAILED to DEAD_LETTER', () => {
      const job = Job.create('job-1', 'test', {}, 0, 3, 0, null, 'corr-1');
      job.markStarted('worker-1');
      job.markFailed('Fatal error');

      job.moveToDeadLetter();

      expect(job.status).toBe(JobStatus.DEAD_LETTER);
    });
  });

  describe('cancel', () => {
    it('should cancel a QUEUED job', () => {
      const job = Job.create('job-1', 'test', {}, 0, 3, 0, null, 'corr-1');
      
      job.cancel();

      expect(job.status).toBe(JobStatus.CANCELLED);
    });

    it('should not cancel a COMPLETED job', () => {
      const job = Job.create('job-1', 'test', {}, 0, 3, 0, null, 'corr-1');
      job.markStarted('worker-1');
      job.markCompleted();

      expect(() => job.cancel()).toThrow(/Cannot cancel/);
    });
  });

  describe('canRetry', () => {
    it('should return true when retries available', () => {
      const job = Job.create('job-1', 'test', {}, 0, 3, 0, null, 'corr-1');
      job.markStarted('worker-1');
      job.markFailed('Error');

      expect(job.canRetry()).toBe(true);
    });

    it('should return false when max attempts reached', () => {
      const job = Job.create('job-1', 'test', {}, 0, 1, 0, null, 'corr-1');
      job.markStarted('worker-1');
      job.markFailed('Error');

      expect(job.canRetry()).toBe(false);
    });
  });

  describe('isFinalState', () => {
    it('should return true for COMPLETED', () => {
      const job = Job.create('job-1', 'test', {}, 0, 3, 0, null, 'corr-1');
      job.markStarted('worker-1');
      job.markCompleted();

      expect(job.isFinalState()).toBe(true);
    });

    it('should return false for QUEUED', () => {
      const job = Job.create('job-1', 'test', {}, 0, 3, 0, null, 'corr-1');

      expect(job.isFinalState()).toBe(false);
    });
  });
});
