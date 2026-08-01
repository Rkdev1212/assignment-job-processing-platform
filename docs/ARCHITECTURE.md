# AsyncFlow Architecture

## Overview

AsyncFlow is built using Clean Architecture principles with clear separation between business logic and infrastructure concerns. The system is designed as a modular monolith that can evolve into microservices if needed.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    External Clients                      │
│                  (HTTP, Webhooks, etc.)                  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                     API Gateway                          │
│           (Rate Limiting, Authentication)                │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
┌────────▼────────┐             ┌───────▼────────┐
│   API Server    │             │  Worker Pool   │
│   (NestJS)      │             │  (Processors)  │
└────────┬────────┘             └───────┬────────┘
         │                               │
         └───────────────┬───────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
    │PostgreSQL│    │  Redis  │    │ BullMQ  │
    │(State)   │    │(Cache)  │    │(Queue)  │
    └─────────┘    └─────────┘    └─────────┘
```

## Layered Architecture

### 1. Presentation Layer (API Server)

**Responsibilities:**
- HTTP request handling
- Request validation
- Response formatting
- Authentication/Authorization
- Rate limiting
- Swagger documentation

**Components:**
- Controllers (JobController, QueueController, etc.)
- DTOs (CreateJobDto, JobResponseDto, etc.)
- Middleware (CORS, Logging, Correlation ID)
- Guards (JWT Authentication)
- Filters (Exception handling)

**Technology:**
- NestJS framework
- class-validator for validation
- Swagger for API documentation

### 2. Application Layer

**Responsibilities:**
- Business workflows
- Use case orchestration
- Transaction coordination
- Event handling
- Service composition

**Components:**
- Services (JobService)
- Event handlers
- Application-specific logic

**Key Characteristics:**
- Depends only on Domain and Contracts
- No framework dependencies
- Testable in isolation

### 3. Domain Layer (Core)

**Responsibilities:**
- Business entities
- Domain events
- Business rules
- State machines
- Value objects

**Components:**
- Entities (Job)
- Domain Events (JobCreated, JobCompleted, etc.)
- Enums (JobStatus)
- Validation logic

**Key Characteristics:**
- No external dependencies
- Pure business logic
- Framework-agnostic
- Highly testable

### 4. Infrastructure Layer

**Responsibilities:**
- Database access
- Queue operations
- External service integration
- Logging
- Metrics collection

**Components:**
- Repositories (PrismaJobRepository)
- Queue adapters (BullMQQueuePublisher)
- Logger implementations (PinoLogger)
- Metrics collectors (PrometheusMetrics)

**Key Characteristics:**
- Implements contracts from Domain
- Contains all third-party integrations
- Can be swapped without affecting business logic

## Data Flow

### Job Creation Flow

```
1. Client Request
   └─> POST /api/v1/jobs

2. Presentation Layer
   └─> JobController.createJob()
       └─> Validate DTO
       └─> Extract correlation ID

3. Application Layer
   └─> JobService.createJob()
       └─> Generate job ID
       └─> Create Job entity
       └─> Emit JobCreated event

4. Infrastructure Layer
   └─> JobRepository.create()
       └─> Persist to PostgreSQL
   └─> QueuePublisher.addJob()
       └─> Add to BullMQ queue

5. Response
   └─> Return JobResponseDto
```

### Job Processing Flow

```
1. Worker Process
   └─> BullMQ Worker polls queue

2. Job Dequeued
   └─> JobProcessor.processJob()
       └─> Fetch job from database
       └─> Mark job as PROCESSING
       └─> Update database

3. Job Execution
   └─> Execute job handler
       └─> Success: Mark COMPLETED
       └─> Failure: Mark FAILED → Retry or Dead Letter

4. Metrics & Logging
   └─> Update Prometheus metrics
   └─> Log structured events
```

## Component Interactions

### Dependency Injection

```typescript
// Configuration at startup
const jobRepository = new PrismaJobRepository(prisma);
const queuePublisher = new BullMQQueuePublisher(redis);
const jobService = new JobService(
  jobRepository,
  queuePublisher,
  logger,
  metrics,
);
```

### Interface Contracts

```typescript
// Domain defines contract
interface IJobRepository {
  create(job: Job): Promise<Job>;
  findById(id: string): Promise<Job | null>;
}

// Infrastructure implements
class PrismaJobRepository implements IJobRepository {
  // Prisma-specific implementation
}

// Application uses abstraction
class JobService {
  constructor(private repository: IJobRepository) {}
}
```

## State Management

### Job State Machine

```
┌──────────┐
│  QUEUED  │
└────┬─────┘
     │
     ▼
┌────────────┐
│ PROCESSING │◄──────────┐
└─────┬──────┘           │
      │                  │
  ┌───▼────┐      ┌──────┴─────┐
  │COMPLETED│     │  RETRYING   │
  └────────┘      └──────┬──────┘
                         │
                   ┌─────▼──────┐
                   │   FAILED   │
                   └─────┬──────┘
                         │
                  ┌──────▼────────┐
                  │ DEAD_LETTER   │
                  └───────────────┘

CANCELLED (from most states)
```

### State Transitions

Enforced by Job entity:
```typescript
class Job {
  markStarted() {
    this.validateTransition(JobStatus.PROCESSING);
    // ... update state
  }
}
```

## Event-Driven Architecture

### Domain Events

Events capture business occurrences:
```typescript
class JobCreatedEvent extends DomainEvent {
  constructor(jobId, type, payload, correlationId) {
    super('job.created', jobId);
  }
}
```

### Event Flow

```
Job Entity
  └─> Emits Domain Event
      └─> Event Handler (future: publish to event bus)
          └─> Update metrics
          └─> Trigger notifications
          └─> Update read models
```

## Scalability Considerations

### Horizontal Scaling

**API Servers:**
- Stateless design
- JWT authentication (no sessions)
- Multiple instances behind load balancer
- Shared Redis and PostgreSQL

**Workers:**
- Multiple worker instances
- BullMQ distributed locking
- Each worker processes jobs concurrently
- No shared state between workers

### Database Scaling

**Read Replicas:**
```
Master (writes) ──┐
                  ├─> Replica 1 (reads)
                  ├─> Replica 2 (reads)
                  └─> Replica 3 (reads)
```

**Connection Pooling:**
- Use PgBouncer for connection management
- Prisma connection pool configuration

### Queue Scaling

**Redis Cluster:**
- High availability
- Data sharding
- Automatic failover

## Observability

### Structured Logging

Every log entry includes:
```json
{
  "level": "info",
  "timestamp": "2024-01-01T00:00:00Z",
  "service": "AsyncFlowAPI",
  "requestId": "req-123",
  "correlationId": "corr-456",
  "jobId": "job-789",
  "workerId": "worker-1",
  "duration": 150,
  "message": "Job completed successfully"
}
```

### Metrics Collection

**Prometheus Metrics:**
- Counters: jobs_processed_total, jobs_failed_total
- Gauges: queue_depth, worker_busy
- Histograms: job_processing_time_seconds

### Health Checks

**Deep Health Check:**
- Database connectivity
- Redis connectivity
- Queue status
- System resources

## Security

### Authentication

- JWT tokens for API access
- Token validation on protected endpoints
- Short-lived tokens (24h default)

### Authorization

- Role-based access control (future)
- Resource-level permissions (future)

### Data Protection

- Database connection encryption (TLS)
- Redis encryption in transit
- Sensitive data in environment variables
- No secrets in code or logs

## Performance

### Caching Strategy

**Redis Cache:**
- Queue operations (BullMQ)
- Rate limiting counters
- Session data (future)

### Database Optimization

**Indexes:**
- status, type, correlationId, createdAt
- Priority and runAt for queue queries

**Query Optimization:**
- Pagination for large result sets
- Selective field projection
- Efficient joins

### Batch Operations

- Bulk job creation (future)
- Batch status updates (future)

## Resilience

### Retry Mechanism

**Exponential Backoff:**
```
Attempt 1: 1 second delay
Attempt 2: 2 seconds delay
Attempt 3: 4 seconds delay
```

### Circuit Breaker

- Prevent cascading failures
- Fast failure for unavailable services
- Automatic recovery

### Graceful Degradation

- Continue processing if metrics fail
- Degrade functionality if cache unavailable
- Queue jobs if worker pool exhausted

## Future Enhancements

### Microservices Evolution

Current monolith can be split:
```
AsyncFlow Monolith
    ├─> Job Management Service (API)
    ├─> Job Processing Service (Worker)
    ├─> Notification Service
    └─> Analytics Service
```

### Event Sourcing

- Store all state changes as events
- Rebuild state from event log
- Time travel debugging
- Audit trail

### CQRS (Command Query Responsibility Segregation)

- Separate read and write models
- Optimized read databases
- Event-driven synchronization

### Multi-tenancy

- Tenant isolation
- Per-tenant queues
- Resource quotas
- Billing integration

## References

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design - Eric Evans](https://www.domainlanguage.com/ddd/)
- [Building Microservices - Sam Newman](https://www.oreilly.com/library/view/building-microservices/9781491950340/)
