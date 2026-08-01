/**
 * Metrics Collector Interface
 * 
 * Abstracts metrics collection and reporting.
 */
export interface IMetricsCollector {
  /**
   * Increment counter
   */
  incrementCounter(name: string, value?: number, labels?: Record<string, string>): void;

  /**
   * Set gauge value
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void;

  /**
   * Record histogram value
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void;

  /**
   * Get all metrics in Prometheus format
   */
  getMetrics(): Promise<string>;

  /**
   * Get metrics as JSON
   */
  getMetricsJson(): Promise<MetricsData>;
}

/**
 * Metrics Data
 */
export interface MetricsData {
  jobsProcessedTotal: number;
  jobsCompletedTotal: number;
  jobsFailedTotal: number;
  jobsRetryTotal: number;
  queueDepth: number;
  workerCount: number;
  workerBusy: number;
  averageProcessingTime: number;
  successRate: number;
  deadLetterJobs: number;
}
