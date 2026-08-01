import { Job, JobStatus } from '@asyncflow/shared';

/**
 * Job Repository Interface
 * 
 * Defines the contract for job persistence.
 * Infrastructure layer implements this interface.
 */
export interface IJobRepository {
  /**
   * Create a new job
   */
  create(job: Job): Promise<Job>;

  /**
   * Find job by ID
   */
  findById(id: string): Promise<Job | null>;

  /**
   * Find jobs with filters and pagination
   */
  findMany(filters: JobFilters): Promise<PaginatedResult<Job>>;

  /**
   * Update job
   */
  update(job: Job): Promise<Job>;

  /**
   * Delete job
   */
  delete(id: string): Promise<void>;

  /**
   * Find dead letter jobs
   */
  findDeadLetterJobs(pagination: PaginationParams): Promise<PaginatedResult<Job>>;

  /**
   * Count jobs by status
   */
  countByStatus(status: JobStatus): Promise<number>;

  /**
   * Get jobs for processing (QUEUED or RETRYING)
   */
  getJobsForProcessing(limit: number): Promise<Job[]>;
}

/**
 * Job Filters
 */
export interface JobFilters {
  status?: JobStatus;
  type?: string;
  workerId?: string;
  pagination: PaginationParams;
  sorting?: SortingParams;
}

/**
 * Pagination Parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Sorting Parameters
 */
export interface SortingParams {
  sortBy: string;
  order: 'asc' | 'desc';
}

/**
 * Paginated Result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
