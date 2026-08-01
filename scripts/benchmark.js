#!/usr/bin/env node
/**
 * Benchmark Script for AsyncFlow
 * 
 * Tests job processing throughput and latency
 */

const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_PREFIX = process.env.API_PREFIX || 'api/v1';
const JWT_TOKEN = process.env.JWT_TOKEN || 'test-token';

// Benchmark configurations
const BENCHMARKS = [
  { name: '100 Jobs', count: 100 },
  { name: '1,000 Jobs', count: 1000 },
  { name: '5,000 Jobs', count: 5000 },
  { name: '10,000 Jobs', count: 10000 },
];

/**
 * Create a job via API
 */
function createJob(jobData) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_PREFIX}/jobs`, API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 201) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(jobData));
    req.end();
  });
}

/**
 * Run benchmark
 */
async function runBenchmark(name, count) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Running: ${name}`);
  console.log('='.repeat(60));

  const jobs = [];
  const latencies = [];
  const errors = [];

  const startTime = Date.now();

  // Create jobs concurrently
  console.log(`Creating ${count} jobs...`);

  for (let i = 0; i < count; i++) {
    const jobStartTime = Date.now();
    
    const promise = createJob({
      type: 'benchmark.test',
      payload: { index: i, timestamp: Date.now() },
      priority: Math.floor(Math.random() * 3),
    })
      .then((job) => {
        const latency = Date.now() - jobStartTime;
        latencies.push(latency);
        jobs.push(job);
      })
      .catch((error) => {
        errors.push(error);
      });

    // Add small delay every 100 requests to avoid overwhelming the server
    if (i % 100 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  // Wait for all jobs to complete
  const totalTime = Date.now() - startTime;

  // Calculate statistics
  latencies.sort((a, b) => a - b);
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  const minLatency = latencies[0];
  const maxLatency = latencies[latencies.length - 1];
  const throughput = (jobs.length / totalTime) * 1000;
  const successRate = ((jobs.length / count) * 100).toFixed(2);

  // Display results
  console.log('\n--- Results ---');
  console.log(`Total Jobs Created: ${jobs.length}/${count}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Success Rate: ${successRate}%`);
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Throughput: ${throughput.toFixed(2)} jobs/second`);
  console.log('\nLatency Statistics:');
  console.log(`  Min: ${minLatency}ms`);
  console.log(`  Avg: ${avgLatency.toFixed(2)}ms`);
  console.log(`  P50: ${p50}ms`);
  console.log(`  P95: ${p95}ms`);
  console.log(`  P99: ${p99}ms`);
  console.log(`  Max: ${maxLatency}ms`);

  return {
    name,
    count,
    created: jobs.length,
    errors: errors.length,
    successRate: parseFloat(successRate),
    totalTime,
    throughput: parseFloat(throughput.toFixed(2)),
    latency: {
      min: minLatency,
      avg: parseFloat(avgLatency.toFixed(2)),
      p50,
      p95,
      p99,
      max: maxLatency,
    },
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('\n=== AsyncFlow Benchmark ===\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`API Prefix: ${API_PREFIX}`);

  const results = [];

  for (const benchmark of BENCHMARKS) {
    try {
      const result = await runBenchmark(benchmark.name, benchmark.count);
      results.push(result);
      
      // Wait between benchmarks
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`\nBenchmark failed: ${error.message}`);
    }
  }

  // Summary table
  console.log('\n\n=== Summary ===\n');
  console.log('| Jobs   | Throughput    | Avg Latency | P95 Latency | Success Rate |');
  console.log('|--------|---------------|-------------|-------------|--------------|');
  
  results.forEach((r) => {
    console.log(
      `| ${r.count.toString().padEnd(6)} | ${r.throughput.toString().padEnd(13)} | ${r.latency.avg.toString().padEnd(11)} | ${r.latency.p95.toString().padEnd(11)} | ${r.successRate.toString().padEnd(12)} |`,
    );
  });

  console.log('\n');
}

// Run benchmarks
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
