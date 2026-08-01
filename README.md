# AsyncFlow — Job Processing Platform

A production-grade asynchronous job processing platform built with clean architecture principles, deployed and running live.

**Live API:** https://assignment-job-processing-platform.onrender.com  
**Swagger UI:** https://assignment-job-processing-platform.onrender.com/api/docs  
**Health Check:** https://assignment-job-processing-platform.onrender.com/api/v1/health  

> **Cold start notice:** The API and Worker run on Render's free tier and may take **30–60 seconds** to wake up after inactivity. If the first request times out, wait a moment and retry. Upstash Redis on the free tier also has an occasional ~1s cold connection latency on first use.

---

## Architecture

AsyncFlow follows Clean Architecture with clear separation of concerns across a Turborepo monorepo:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│              (Controllers, DTOs, Middleware)                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Application Layer                         │
│                   (Services, Use Cases)                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                       Domain Layer                           │
│              (Entities, Value Objects, Events)               │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   Infrastructure Layer                       │
│           (BullMQ, Prisma, Redis, Repositories)              │
└─────────────────────────────────────────────────────────────┘
```

### Job State Machine

```
QUEUED → PROCESSING → COMPLETED
                    ↘ RETRYING → FAILED → DEAD_LETTER
CANCELLED (from any state)
```

---

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20, TypeScript 5 |
| Framework | NestJS 10 |
| Queue | BullMQ 4 |
| Broker | Redis (Upstash) |
| Database | PostgreSQL (Render) |
| ORM | Prisma 5 |
| Monorepo | TurboRepo |
| Logging | Pino (structured JSON) |
| Metrics | Prometheus |
| Docs | Swagger / OpenAPI |
| Containers | Docker |

---

## Testing the Live API

### Option 1 — Swagger UI (recommended)

1. Open **https://assignment-job-processing-platform.onrender.com/api/docs**
2. Call `POST /auth/token` with body `{"username": "testuser"}` — copy the `token` value
3. Click **Authorize** (top right), enter `Bearer <token>`
4. Use any protected endpoint

### Option 2 — curl

**Get a token:**
```bash
curl -s -X POST https://assignment-job-processing-platform.onrender.com/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser"}' | jq .token
```

**Create a job:**
```bash
curl -X POST https://assignment-job-processing-platform.onrender.com/api/v1/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"type":"email","payload":{"to":"test@example.com"},"priority":1,"maxAttempts":3}'
```

**Check job status:**
```bash
curl https://assignment-job-processing-platform.onrender.com/api/v1/jobs/<job-id>
```

**List all jobs:**
```bash
curl https://assignment-job-processing-platform.onrender.com/api/v1/jobs
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/token` | — | Generate demo JWT |
| POST | `/api/v1/jobs` | ✅ | Create a job |
| GET | `/api/v1/jobs` | — | List jobs (filterable) |
| GET | `/api/v1/jobs/:id` | — | Get job by ID |
| DELETE | `/api/v1/jobs/:id` | ✅ | Cancel a job |
| POST | `/api/v1/queue/pause` | ✅ | Pause the queue |
| POST | `/api/v1/queue/resume` | ✅ | Resume the queue |
| GET | `/api/v1/queue/status` | ✅ | Queue stats |
| GET | `/api/v1/metrics` | — | Prometheus metrics |
| GET | `/api/v1/metrics/json` | — | Metrics as JSON |
| GET | `/api/v1/health` | — | Deep health check |

---

## Project Structure

```
├── apps/
│   ├── api/          # NestJS REST API
│   └── worker/       # BullMQ job processor
├── packages/
│   ├── contracts/    # Shared interfaces
│   ├── database/     # Prisma schema & migrations
│   ├── queue/        # Redis/BullMQ abstractions
│   ├── logger/       # Pino logger
│   ├── metrics/      # Prometheus metrics
│   ├── config/       # Configuration service
│   ├── shared/       # Domain models & events
│   └── utils/        # Retry strategies, ID generation
├── docs/
│   └── adr/          # Architecture Decision Records
└── docker-compose.yml
```

---

## Running Locally

**Prerequisites:** Node.js 20+, Docker

```bash
git clone https://github.com/Rkdev1212/assignment-job-processing-platform.git
cd assignment-job-processing-platform

# Start everything (API + Worker + Redis + Postgres)
docker-compose up
```

- API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/api/docs

---

## Key Design Decisions

- **[ADR-001](./docs/adr/001-use-bullmq.md)** — BullMQ for reliable queue with retries, delay, and priority
- **[ADR-002](./docs/adr/002-use-postgresql.md)** — PostgreSQL for ACID-compliant job state persistence
- **[ADR-003](./docs/adr/003-use-turborepo.md)** — TurboRepo for fast, cached monorepo builds
- **[ADR-004](./docs/adr/004-repository-pattern.md)** — Repository pattern for data access abstraction
- **[ADR-005](./docs/adr/005-clean-architecture.md)** — Clean Architecture for framework-independent business logic

---

- **BullMQ over custom queue** — mature, Redis-backed, handles retries/delays/priority natively with at-least-once delivery guarantees
- **Clean Architecture** — business logic in domain layer, independent of NestJS/Prisma/BullMQ. Each layer only depends inward
- **Repository pattern** — `IJobRepository` interface decouples domain from Prisma. Swap databases without touching business logic
- **Monorepo (TurboRepo)** — shared packages (`contracts`, `shared`, `config`) used by both API and Worker with zero duplication and parallel builds
- **Separate Worker process** — worker runs independently from the API so they scale separately and a worker crash doesn't affect the API
- **String injection tokens** — NestJS DI uses string tokens (`ILogger`, `IJobRepository`) instead of interface types since TypeScript interfaces are erased at runtime
- **Priority as 0–10 numeric internally** — accepts `high/normal/low` strings in the API (mapped to 10/5/0) for spec compliance while BullMQ works with numerics

## Assumptions

- External services (email, SMS) are simulated — the worker logs the payload and introduces a random delay to mimic real processing
- A 10% random failure rate is intentional in the worker to demonstrate retry and dead letter queue behaviour
- Authentication is demo-only — `POST /auth/token` is provided for testing convenience; in production this would be a proper identity service
- Job types are open-ended strings (`email`, `sms`, `report`, etc.) — the worker routes by type but doesn't enforce a type registry
- Multiple workers can run concurrently — BullMQ handles distributed locking via Redis to prevent duplicate execution

---

MIT
