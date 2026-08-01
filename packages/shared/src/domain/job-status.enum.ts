/**
 * Job Status Enum
 * 
 * Represents all possible states in the job lifecycle.
 * State transitions are enforced by the Job entity.
 */
export enum JobStatus {
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  RETRYING = 'RETRYING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  DEAD_LETTER = 'DEAD_LETTER',
  CANCELLED = 'CANCELLED',
}

/**
 * Valid state transitions map
 */
export const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  [JobStatus.QUEUED]: [JobStatus.PROCESSING, JobStatus.CANCELLED],
  [JobStatus.PROCESSING]: [
    JobStatus.COMPLETED,
    JobStatus.FAILED,
    JobStatus.RETRYING,
    JobStatus.CANCELLED,
  ],
  [JobStatus.RETRYING]: [JobStatus.PROCESSING, JobStatus.FAILED, JobStatus.CANCELLED, JobStatus.DEAD_LETTER],
  [JobStatus.FAILED]: [JobStatus.DEAD_LETTER, JobStatus.RETRYING],
  [JobStatus.COMPLETED]: [],
  [JobStatus.DEAD_LETTER]: [],
  [JobStatus.CANCELLED]: [],
};

/**
 * Check if a state transition is valid
 */
export function isValidTransition(from: JobStatus, to: JobStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
