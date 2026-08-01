import { Counter, Gauge, Histogram, Registry, register } from 'prom-client';
import { IMetricsCollector, MetricsData } from '@asyncflow/contracts';

/**
 * Prometheus Metrics Service
 * 
 * Collects and exposes metrics in Prometheus format.
 */
export class PrometheusMetricsService implements IMetricsCollector {
  private registry: Registry;
  private counters: Map<string, Counter>;
  private gauges: Map<string, Gauge>;
  private histograms: Map<string, Histogram>;

  constructor() {
    this.registry = register;
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();

    this.initializeMetrics();
  }

  /**
   * Initialize default metrics
   */
  private initializeMetrics(): void {
    // Job counters
    this.createCounter('jobs_processed_total', 'Total number of jobs processed');
    this.createCounter('jobs_completed_total', 'Total number of jobs completed successfully');
    this.createCounter('jobs_failed_total', 'Total number of jobs failed');
    this.createCounter('jobs_retry_total', 'Total number of job retries');

    // Queue gauges
    this.createGauge('queue_depth', 'Current number of jobs in queue');
    this.createGauge('worker_count', 'Total number of workers');
    this.createGauge('worker_busy', 'Number of busy workers');
    this.createGauge('dead_letter_jobs', 'Number of jobs in dead letter queue');

    // Processing time histogram
    this.createHistogram(
      'job_processing_time_seconds',
      'Job processing time in seconds',
      [0.1, 0.5, 1, 2, 5, 10, 30, 60],
    );
  }

  /**
   * Create counter metric
   */
  private createCounter(name: string, help: string): void {
    if (!this.counters.has(name)) {
      this.counters.set(
        name,
        new Counter({
          name,
          help,
          registers: [this.registry],
        }),
      );
    }
  }

  /**
   * Create gauge metric
   */
  private createGauge(name: string, help: string): void {
    if (!this.gauges.has(name)) {
      this.gauges.set(
        name,
        new Gauge({
          name,
          help,
          registers: [this.registry],
        }),
      );
    }
  }

  /**
   * Create histogram metric
   */
  private createHistogram(name: string, help: string, buckets: number[]): void {
    if (!this.histograms.has(name)) {
      this.histograms.set(
        name,
        new Histogram({
          name,
          help,
          buckets,
          registers: [this.registry],
        }),
      );
    }
  }

  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    const counter = this.counters.get(name);
    if (counter) {
      if (labels) {
        counter.inc(labels, value);
      } else {
        counter.inc(value);
      }
    }
  }

  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const gauge = this.gauges.get(name);
    if (gauge) {
      if (labels) {
        gauge.set(labels, value);
      } else {
        gauge.set(value);
      }
    }
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const histogram = this.histograms.get(name);
    if (histogram) {
      if (labels) {
        histogram.observe(labels, value);
      } else {
        histogram.observe(value);
      }
    }
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  async getMetricsJson(): Promise<MetricsData> {
    const metrics = await this.registry.getMetricsAsJSON();

    const getData = (name: string): number => {
      const metric = metrics.find((m) => m.name === name);
      if (!metric || !metric.values || metric.values.length === 0) {
        return 0;
      }
      return (metric.values[0] as any).value || 0;
    };

    const jobsProcessed = getData('jobs_processed_total');
    const jobsCompleted = getData('jobs_completed_total');
    const jobsFailed = getData('jobs_failed_total');

    return {
      jobsProcessedTotal: jobsProcessed,
      jobsCompletedTotal: jobsCompleted,
      jobsFailedTotal: jobsFailed,
      jobsRetryTotal: getData('jobs_retry_total'),
      queueDepth: getData('queue_depth'),
      workerCount: getData('worker_count'),
      workerBusy: getData('worker_busy'),
      averageProcessingTime: 0, // Calculated separately if needed
      successRate: jobsProcessed > 0 ? (jobsCompleted / jobsProcessed) * 100 : 0,
      deadLetterJobs: getData('dead_letter_jobs'),
    };
  }

  /**
   * Reset all metrics (for testing)
   */
  reset(): void {
    this.registry.clear();
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.initializeMetrics();
  }
}
