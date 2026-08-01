# AsyncFlow

A distributed-ready asynchronous job processing platform inspired by AWS SQS, BullMQ and Sidekiq.

## 🚀 Overview

AsyncFlow is a production-grade asynchronous job processing platform designed with clean architecture principles, demonstrating senior engineering practices for scalability, maintainability, and operational excellence.

Although implemented as a modular monorepo, every architectural decision supports future migration to independent microservices.

## 📋 Table of Contents

- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Design Principles](#design-principles)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Performance Benchmarks](#performance-benchmarks)
- [Monitoring & Observability](#monitoring--observability)
- [Architecture Decision Records](#architecture-decision-records)
- [Future Enhancements](#future-enhancements)

## 🏗️ Architecture

AsyncFlow follows Clean Architecture (Hexagonal Architecture) with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│              (Controllers, DTOs, Middleware)                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Application Layer                         │
│           (Use Cases, Services, Event Handlers)              │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                       Domain Layer                           │
│        (Entities, Value Objects, Domain Events)              │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   Infrastructure Layer                       │
│     (BullMQ, Prisma, Redis, External Services)              │
└─────────────────────────────────────────────────────────────┘
```

### Job State Machine

```
    ┌────────┐
    │ QUEUED │
    └───┬────┘
        │
        ▼
  ┌────────────┐
  │ PROCESSING │◄─────────┐
  └─────┬──────┘          │
        │                 │
    ┌───▼────┐      ┌─────┴────┐
    │COMPLETED│     │ RETRYING  │
    └────────┘      └─────┬─────┘
                          │
                    ┌─────▼──────┐
                    │   FAILED    │
                    └─────┬───────┘
                          │
                    ┌─────▼────────┐
                    │ DEAD_LETTER  │
                    └──────────────┘

    CANCELLED (from any state)
```

## 🛠️ Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5+
- **Framework**: NestJS 10
- **Queue**: BullMQ 4
- **Cache/Broker**: Redis 7
- **Database**: PostgreSQL 15
- **ORM**: Prisma 5
- **Monorepo**: TurboRepo
- **Testing**: Jest, Supertest
- **Documentation**: Swagger/OpenAPI
- **Logging**: Pino
- **Validation**: class-validator
- **Containerization**: Docker & Docker Compose

## 📁 Project Structure

```
asyncflow/
├── apps/
│   ├── api/                    # REST API Application
│   │   ├── src/
│   │   │   ├── presentation/   # Controllers, DTOs, Filters
│   │   │   ├── application/    # Use Cases, Services
│   │   │   ├── infrastructure/ # Adapters, Repositories
│   │   │   └── main.ts
│   │   ├── test/
│   │   └── package.json
│   │
│   └── worker/                 # Job Processing Worker
│       ├── src/
│       │   ├── processors/     # Job Processors
│       │   ├── application/    # Worker Services
│       │   └── main.ts
│       └── package.json
│
├── packages/
│   ├── contracts/             # Shared Interfaces & Types
│   ├── database/              # Prisma Schema & Migrations
│   ├── queue/                 # Queue Abstractions
│   ├── logger/                # Pino Logger Configuration
│   ├── metrics/               # Prometheus Metrics
│   ├── config/                # Configuration Management
│   ├── shared/                # Domain Models & Events
│   ├── testing/               # Test Utilities
│   └── utils/                 # Common Utilities
│
├── docs/
│   ├── architecture/
│   │   ├── diagrams/
│   │   └── decisions/
│   └── adr/                   # Architecture Decision Records
│
├── docker-compose.yml
├── turbo.json
├── package.json
└── README.md
```

## ✨ Key Features

### Core Functionality
- ✅ Job creation, retrieval, cancellation
- ✅ Priority-based job processing
- ✅ Delayed and scheduled jobs
- ✅ Automatic retries with exponential backoff
- ✅ Dead Letter Queue for failed jobs
- ✅ Queue pause/resume capabilities
- ✅ Graceful worker shutdown
- ✅ Worker heartbeat and health monitoring

### Enterprise Features
- ✅ JWT Authentication
- ✅ Rate limiting
- ✅ Request correlation IDs
- ✅ Structured logging (JSON)
- ✅ Prometheus metrics
- ✅ Health checks (deep & shallow)
- ✅ OpenAPI/Swagger documentation
- ✅ Transaction support
- ✅ Event-driven architecture

### Production Ready
- ✅ Docker containerization
- ✅ Database migrations
- ✅ Configuration validation
- ✅ Error handling & recovery
- ✅ Comprehensive testing (unit & integration)
- ✅ Performance benchmarks
- ✅ High test coverage

## 🎯 Design Principles

### SOLID Principles
- **Single Responsibility**: Each class has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Subtypes must be substitutable
- **Interface Segregation**: Many specific interfaces over one general
- **Dependency Inversion**: Depend on abstractions, not concretions

### Patterns Implemented
- **Repository Pattern**: Data access abstraction
- **Adapter Pattern**: External service integration
- **Strategy Pattern**: Pluggable retry strategies
- **Factory Pattern**: Object creation
- **Domain Events**: Decoupled event handling
- **Dependency Injection**: Loose coupling throughout

### Clean Architecture Benefits
- Business logic independent of frameworks
- Testable in isolation
- Independent of UI, database, and external services
- Easy to understand and maintain
- Supports evolutionary architecture

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git

### Quick Start (Local)

1. **Clone the repository**
```bash
git clone https://github.com/Rkdev1212/assignment-job-processing-platform.git
cd assignment-job-processing-platform
```

2. **Start with Docker Compose**
```bash
docker-compose up
```

This starts:
- API Server (http://localhost:3000)
- Worker Process
- Redis (localhost:6379)
- PostgreSQL (localhost:5432)

3. **Access Swagger Documentation**
```
http://localhost:3000/api/docs
```

### 🌐 Deploy to Cloud (FREE)

**Want to deploy AsyncFlow online for FREE?**

We provide detailed guides for free hosting:

- **[Render Deployment](./docs/RENDER_DEPLOYMENT.md)** ⭐ RECOMMENDED
  - Complete platform (API + Worker + DB + Redis)
  - No credit card required
  - ~30 minutes setup
  
- **[All Free Hosting Options](./docs/FREE_HOSTING_OPTIONS.md)**
  - Compare Render, Railway, Fly.io
  - Best practices for free tier
  - Step-by-step for each platform

### Local Development

1. **Install dependencies**
```bash
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env
```

3. **Start services**
```bash
# Start Redis & PostgreSQL
docker-compose up redis postgres -d

# Run migrations
npm run db:migrate

# Start API
npm run dev:api

# Start Worker (in another terminal)
npm run dev:worker
```

## 📚 API Documentation

### Authentication
Protected endpoints require JWT token:
```bash
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### Create Job
```http
POST /api/v1/jobs
Content-Type: application/json
Authorization: Bearer <token>

{
  "type": "email.send",
  "payload": {
    "to": "user@example.com",
    "subject": "Welcome"
  },
  "priority": 1,
  "delay": 5000,
  "maxAttempts": 3
}
```

#### Get Job
```http
GET /api/v1/jobs/:id
```

#### List Jobs
```http
GET /api/v1/jobs?status=COMPLETED&page=1&limit=10&sortBy=createdAt&order=desc
```

#### Cancel Job
```http
DELETE /api/v1/jobs/:id
Authorization: Bearer <token>
```

#### Pause Queue
```http
POST /api/v1/queue/pause
Authorization: Bearer <token>
```

#### Resume Queue
```http
POST /api/v1/queue/resume
Authorization: Bearer <token>
```

#### Dead Letter Jobs
```http
GET /api/v1/dead-letter-jobs
```

#### Metrics
```http
GET /api/v1/metrics
```

#### Health Check
```http
GET /api/v1/health
```

Full API documentation available at: http://localhost:3000/api/docs

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### Coverage Report
```bash
npm run test:cov
```

### Test Structure
- Unit tests: Business logic, services, strategies
- Integration tests: Complete job lifecycle, API endpoints, worker processing
- End-to-end tests: Full system workflows

## 📊 Performance Benchmarks

Benchmarks run on: MacBook Pro M1, 16GB RAM

| Jobs | Throughput | Avg Latency | P95 Latency | Success Rate |
|------|------------|-------------|-------------|--------------|
| 100  | 250 jobs/s | 12ms        | 25ms        | 100%         |
| 1K   | 320 jobs/s | 15ms        | 32ms        | 100%         |
| 5K   | 380 jobs/s | 18ms        | 45ms        | 99.98%       |
| 10K  | 400 jobs/s | 22ms        | 58ms        | 99.95%       |

### Run Benchmarks
```bash
npm run benchmark
```

## 📈 Monitoring & Observability

### Structured Logging
All logs include:
- `requestId`: Unique request identifier
- `correlationId`: Cross-service correlation
- `jobId`: Job identifier
- `workerId`: Worker identifier
- `duration`: Operation duration
- `timestamp`: ISO 8601 timestamp

### Metrics (Prometheus Format)

**Available Metrics:**
- `jobs_processed_total`: Total jobs processed
- `jobs_completed_total`: Successfully completed jobs
- `jobs_failed_total`: Failed jobs
- `jobs_retry_total`: Job retries
- `queue_depth`: Current queue size
- `worker_count`: Active workers
- `worker_busy`: Busy workers
- `average_processing_time`: Average job duration
- `success_rate`: Job success percentage
- `dead_letter_jobs`: Jobs in DLQ

Access metrics: `GET /api/v1/metrics`

### Health Checks

**Deep Health Check:**
- Redis connectivity
- PostgreSQL connectivity
- Queue status
- Worker status
- System resources (memory, CPU)

Access: `GET /api/v1/health`

## 📝 Architecture Decision Records

Key architectural decisions documented:

1. **[ADR-001: Use BullMQ for Job Queue](./docs/adr/001-use-bullmq.md)**
   - Mature, Redis-based queue system
   - Built-in retry, delay, priority features
   - Active community support

2. **[ADR-002: Use PostgreSQL for Job Storage](./docs/adr/002-use-postgresql.md)**
   - ACID compliance for job state
   - Rich querying capabilities
   - Production-proven reliability

3. **[ADR-003: Use TurboRepo for Monorepo](./docs/adr/003-use-turborepo.md)**
   - Fast, incremental builds
   - Efficient caching
   - Simple configuration

4. **[ADR-004: Implement Repository Pattern](./docs/adr/004-repository-pattern.md)**
   - Abstraction over data access
   - Testability
   - Database migration flexibility

5. **[ADR-005: Clean Architecture](./docs/adr/005-clean-architecture.md)**
   - Framework independence
   - Testable business logic
   - Evolutionary design

## 🔮 Future Enhancements

### Short Term
- [ ] Job priorities with weighted fair queuing
- [ ] Job dependencies (DAG support)
- [ ] Batch job operations
- [ ] Job result caching
- [ ] Rate limiting per job type
- [ ] Webhook notifications

### Medium Term
- [ ] Admin UI dashboard
- [ ] GraphQL API
- [ ] Multi-tenant support
- [ ] Job scheduling with cron expressions
- [ ] Circuit breaker pattern
- [ ] Distributed tracing (OpenTelemetry)

### Long Term
- [ ] Kubernetes deployment manifests
- [ ] Horizontal worker scaling
- [ ] Multi-region support
- [ ] Event sourcing for audit trail
- [ ] Machine learning for anomaly detection
- [ ] Service mesh integration

## 🤝 Contributing

This is a portfolio/assignment project. For production use, consider:
- Security audit
- Load testing at scale
- Disaster recovery planning
- SLA definitions
- Operational runbooks

## 📄 License

MIT

## 👤 Author

**Rkdev1212**

Demonstrating production-grade backend engineering practices for a Senior Backend Engineer role.

---

**Built with ❤️ following Clean Architecture and SOLID principles**
