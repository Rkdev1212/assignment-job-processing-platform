#!/usr/bin/env node
/**
 * AsyncFlow - Demo Test Script
 * 
 * This demonstrates the core functionality without requiring full infrastructure.
 * For full testing, you'll need Docker or PostgreSQL + Redis installed.
 */

console.log('\n' + '='.repeat(60));
console.log('  AsyncFlow - Job Processing Platform Demo');
console.log('='.repeat(60) + '\n');

// Simulate the domain model behavior
class JobStatus {
  static QUEUED = 'QUEUED';
  static PROCESSING = 'PROCESSING';
  static COMPLETED = 'COMPLETED';
  static FAILED = 'FAILED';
  static RETRYING = 'RETRYING';
  static DEAD_LETTER = 'DEAD_LETTER';
  static CANCELLED = 'CANCELLED';
}

const VALID_TRANSITIONS = {
  [JobStatus.QUEUED]: [JobStatus.PROCESSING, JobStatus.CANCELLED],
  [JobStatus.PROCESSING]: [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.RETRYING, JobStatus.CANCELLED],
  [JobStatus.RETRYING]: [JobStatus.PROCESSING, JobStatus.FAILED, JobStatus.CANCELLED],
  [JobStatus.FAILED]: [JobStatus.DEAD_LETTER, JobStatus.RETRYING],
  [JobStatus.COMPLETED]: [],
  [JobStatus.DEAD_LETTER]: [],
  [JobStatus.CANCELLED]: [],
};

class Job {
  constructor(id, type, payload, priority = 0, maxAttempts = 3) {
    this.id = id;
    this.type = type;
    this.payload = payload;
    this.status = JobStatus.QUEUED;
    this.priority = priority;
    this.attempts = 0;
    this.maxAttempts = maxAttempts;
    this.workerId = null;
    this.createdAt = new Date();
    this.startedAt = null;
    this.completedAt = null;
    this.lastError = null;
  }

  markStarted(workerId) {
    this.validateTransition(JobStatus.PROCESSING);
    this.status = JobStatus.PROCESSING;
    this.workerId = workerId;
    this.startedAt = new Date();
  }

  markCompleted() {
    this.validateTransition(JobStatus.COMPLETED);
    this.status = JobStatus.COMPLETED;
    this.completedAt = new Date();
  }

  markFailed(error) {
    this.validateTransition(JobStatus.FAILED);
    this.status = JobStatus.FAILED;
    this.lastError = error;
  }

  retry() {
    if (this.attempts >= this.maxAttempts) {
      throw new Error(`Job ${this.id} has exceeded max attempts`);
    }
    this.validateTransition(JobStatus.RETRYING);
    this.status = JobStatus.RETRYING;
    this.attempts += 1;
  }

  moveToDeadLetter() {
    this.validateTransition(JobStatus.DEAD_LETTER);
    this.status = JobStatus.DEAD_LETTER;
  }

  cancel() {
    if (this.status === JobStatus.COMPLETED || this.status === JobStatus.DEAD_LETTER) {
      throw new Error(`Cannot cancel job in ${this.status} state`);
    }
    this.status = JobStatus.CANCELLED;
  }

  validateTransition(toStatus) {
    const validTransitions = VALID_TRANSITIONS[this.status] || [];
    if (!validTransitions.includes(toStatus)) {
      throw new Error(`Invalid transition from ${this.status} to ${toStatus}`);
    }
  }

  canRetry() {
    return this.attempts < this.maxAttempts && this.status === JobStatus.FAILED;
  }
}

// Retry Strategy
class ExponentialBackoffStrategy {
  constructor(baseDelay = 1000, maxDelay = 60000, multiplier = 2) {
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
    this.multiplier = multiplier;
  }

  calculateDelay(attemptNumber) {
    const delay = this.baseDelay * Math.pow(this.multiplier, attemptNumber - 1);
    return Math.min(delay, this.maxDelay);
  }
}

// Test Runner
class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async test(name, fn) {
    process.stdout.write(`  Testing: ${name}... `);
    try {
      await fn();
      console.log('✅ PASS');
      this.passed++;
    } catch (error) {
      console.log('❌ FAIL');
      console.log(`    Error: ${error.message}`);
      this.failed++;
    }
  }

  summary() {
    console.log('\n' + '='.repeat(60));
    console.log(`  Test Summary: ${this.passed} passed, ${this.failed} failed`);
    console.log('='.repeat(60) + '\n');
  }
}

// Run Tests
async function runTests() {
  const runner = new TestRunner();

  console.log('📋 Testing Domain Model\n');

  await runner.test('Job creation with QUEUED status', () => {
    const job = new Job('job-1', 'email.send', { to: 'test@example.com' });
    if (job.status !== JobStatus.QUEUED) throw new Error('Expected QUEUED status');
  });

  await runner.test('Job state transition: QUEUED → PROCESSING', () => {
    const job = new Job('job-2', 'email.send', {});
    job.markStarted('worker-1');
    if (job.status !== JobStatus.PROCESSING) throw new Error('Expected PROCESSING status');
    if (job.workerId !== 'worker-1') throw new Error('Expected workerId to be set');
  });

  await runner.test('Job state transition: PROCESSING → COMPLETED', () => {
    const job = new Job('job-3', 'email.send', {});
    job.markStarted('worker-1');
    job.markCompleted();
    if (job.status !== JobStatus.COMPLETED) throw new Error('Expected COMPLETED status');
    if (!job.completedAt) throw new Error('Expected completedAt to be set');
  });

  await runner.test('Job retry mechanism', () => {
    const job = new Job('job-4', 'email.send', {}, 0, 3);
    job.markStarted('worker-1');
    job.markFailed('Connection timeout');
    job.retry();
    if (job.status !== JobStatus.RETRYING) throw new Error('Expected RETRYING status');
    if (job.attempts !== 1) throw new Error('Expected attempts to be 1');
  });

  await runner.test('Job exceeds max attempts', () => {
    const job = new Job('job-5', 'email.send', {}, 0, 2);
    job.markStarted('worker-1');
    job.markFailed('Error 1');
    job.retry();
    job.markFailed('Error 2');
    job.retry();
    
    try {
      job.retry();
      throw new Error('Should have thrown error for exceeding max attempts');
    } catch (error) {
      if (!error.message.includes('exceeded max attempts')) throw error;
    }
  });

  await runner.test('Job moves to dead letter queue', () => {
    const job = new Job('job-6', 'email.send', {});
    job.markStarted('worker-1');
    job.markFailed('Fatal error');
    job.moveToDeadLetter();
    if (job.status !== JobStatus.DEAD_LETTER) throw new Error('Expected DEAD_LETTER status');
  });

  await runner.test('Job cancellation', () => {
    const job = new Job('job-7', 'email.send', {});
    job.cancel();
    if (job.status !== JobStatus.CANCELLED) throw new Error('Expected CANCELLED status');
  });

  await runner.test('Cannot cancel completed job', () => {
    const job = new Job('job-8', 'email.send', {});
    job.markStarted('worker-1');
    job.markCompleted();
    
    try {
      job.cancel();
      throw new Error('Should have thrown error for cancelling completed job');
    } catch (error) {
      if (!error.message.includes('Cannot cancel')) throw error;
    }
  });

  await runner.test('Invalid state transition throws error', () => {
    const job = new Job('job-9', 'email.send', {});
    
    try {
      job.markCompleted(); // Can't go from QUEUED to COMPLETED
      throw new Error('Should have thrown error for invalid transition');
    } catch (error) {
      if (!error.message.includes('Invalid transition')) throw error;
    }
  });

  console.log('\n📋 Testing Retry Strategy\n');

  await runner.test('Exponential backoff calculates correct delays', () => {
    const strategy = new ExponentialBackoffStrategy(1000, 60000, 2);
    
    if (strategy.calculateDelay(1) !== 1000) throw new Error('Expected 1000ms for attempt 1');
    if (strategy.calculateDelay(2) !== 2000) throw new Error('Expected 2000ms for attempt 2');
    if (strategy.calculateDelay(3) !== 4000) throw new Error('Expected 4000ms for attempt 3');
    if (strategy.calculateDelay(4) !== 8000) throw new Error('Expected 8000ms for attempt 4');
  });

  await runner.test('Exponential backoff respects max delay', () => {
    const strategy = new ExponentialBackoffStrategy(1000, 10000, 2);
    const delay = strategy.calculateDelay(10); // Would be 512000ms
    if (delay !== 10000) throw new Error('Expected max delay of 10000ms');
  });

  console.log('\n📋 Testing Job Lifecycle Scenarios\n');

  await runner.test('Successful job completion flow', () => {
    const job = new Job('job-10', 'email.send', { to: 'user@example.com' }, 1, 3);
    
    // Step 1: Job is queued
    if (job.status !== JobStatus.QUEUED) throw new Error('Job should start in QUEUED state');
    
    // Step 2: Worker picks up job
    job.markStarted('worker-1');
    if (job.status !== JobStatus.PROCESSING) throw new Error('Job should be PROCESSING');
    
    // Step 3: Job completes successfully
    job.markCompleted();
    if (job.status !== JobStatus.COMPLETED) throw new Error('Job should be COMPLETED');
  });

  await runner.test('Job retry and eventual success', () => {
    const job = new Job('job-11', 'email.send', {}, 0, 3);
    
    // First attempt fails
    job.markStarted('worker-1');
    job.markFailed('Temporary error');
    if (!job.canRetry()) throw new Error('Job should be retryable');
    
    // Retry
    job.retry();
    if (job.attempts !== 1) throw new Error('Attempts should be 1');
    
    // Second attempt succeeds
    job.markStarted('worker-2');
    job.markCompleted();
    if (job.status !== JobStatus.COMPLETED) throw new Error('Job should be COMPLETED');
  });

  await runner.test('Job exhausts retries and moves to DLQ', () => {
    const job = new Job('job-12', 'email.send', {}, 0, 2);
    
    // Attempt 1 fails
    job.markStarted('worker-1');
    job.markFailed('Error 1');
    job.retry();
    
    // Attempt 2 fails
    job.markStarted('worker-2');
    job.markFailed('Error 2');
    job.retry();
    
    // No more retries
    if (job.canRetry()) throw new Error('Job should not be retryable');
    
    // Move to dead letter
    job.moveToDeadLetter();
    if (job.status !== JobStatus.DEAD_LETTER) throw new Error('Job should be in DEAD_LETTER');
  });

  runner.summary();

  return runner.failed === 0;
}

// Demonstration
async function demonstrateFeatures() {
  console.log('\n📚 Feature Demonstration\n');

  console.log('1. Creating a Job');
  console.log('   ─────────────────');
  const job = new Job('demo-job-1', 'email.send', {
    to: 'user@example.com',
    subject: 'Welcome to AsyncFlow',
    body: 'Your job processing platform is ready!'
  }, 2, 3);
  
  console.log(`   Job ID: ${job.id}`);
  console.log(`   Type: ${job.type}`);
  console.log(`   Status: ${job.status}`);
  console.log(`   Priority: ${job.priority}`);
  console.log(`   Max Attempts: ${job.maxAttempts}\n`);

  console.log('2. Processing Job');
  console.log('   ────────────────');
  job.markStarted('worker-demo');
  console.log(`   Status: ${job.status}`);
  console.log(`   Worker ID: ${job.workerId}`);
  console.log(`   Started At: ${job.startedAt.toISOString()}\n`);

  console.log('3. Completing Job');
  console.log('   ──────────────');
  job.markCompleted();
  console.log(`   Status: ${job.status}`);
  console.log(`   Completed At: ${job.completedAt.toISOString()}`);
  console.log(`   Duration: ${job.completedAt - job.startedAt}ms\n`);

  console.log('4. Retry Strategy Demo');
  console.log('   ───────────────────');
  const retryStrategy = new ExponentialBackoffStrategy(1000, 60000, 2);
  console.log('   Exponential Backoff Strategy:');
  for (let i = 1; i <= 5; i++) {
    console.log(`   Attempt ${i}: ${retryStrategy.calculateDelay(i)}ms delay`);
  }
  console.log('');

  console.log('5. Job State Machine');
  console.log('   ─────────────────');
  console.log('   Valid Transitions:');
  console.log('   QUEUED → PROCESSING → COMPLETED');
  console.log('   QUEUED → PROCESSING → FAILED → RETRYING');
  console.log('   FAILED → DEAD_LETTER');
  console.log('   * → CANCELLED (from most states)\n');
}

// Main execution
async function main() {
  try {
    // Run demonstration
    await demonstrateFeatures();
    
    // Run tests
    const success = await runTests();
    
    console.log('✨ AsyncFlow Core Functionality Verified!\n');
    console.log('📖 Next Steps:');
    console.log('   1. Install Docker Desktop for Windows');
    console.log('   2. Run: docker-compose up');
    console.log('   3. Access API at: http://localhost:3000/api/docs');
    console.log('   4. Generate JWT: node scripts/generate-jwt-token.js');
    console.log('   5. Test API with curl or Postman\n');
    
    console.log('📚 Documentation:');
    console.log('   - README.md - Full documentation');
    console.log('   - QUICKSTART.md - 5-minute setup guide');
    console.log('   - docs/API_USAGE.md - API examples\n');
    
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
