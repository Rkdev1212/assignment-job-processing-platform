# AsyncFlow - Quick Start Guide

Get AsyncFlow up and running in 5 minutes!

## Prerequisites

- Docker & Docker Compose
- Git

## Step 1: Clone Repository

```bash
git clone https://github.com/Rkdev1212/assignment-job-processing-platform.git
cd assignment-job-processing-platform
```

## Step 2: Start Services

```bash
docker-compose up
```

This starts:
- ✅ PostgreSQL (localhost:5432)
- ✅ Redis (localhost:6379)
- ✅ API Server (localhost:3000)
- ✅ Worker Process

Wait for: `AsyncFlow API is running on: http://localhost:3000/api/v1`

## Step 3: Access Swagger Documentation

Open your browser:
```
http://localhost:3000/api/docs
```

## Step 4: Generate JWT Token

In a new terminal:
```bash
node scripts/generate-jwt-token.js
```

Copy the token for authenticated requests.

## Step 5: Create Your First Job

```bash
curl -X POST http://localhost:3000/api/v1/jobs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email.send",
    "payload": {
      "to": "test@example.com",
      "subject": "Hello from AsyncFlow!",
      "body": "This is a test email."
    },
    "priority": 1
  }'
```

## Step 6: Check Job Status

Use the job ID from the response:
```bash
curl http://localhost:3000/api/v1/jobs/YOUR_JOB_ID
```

## Step 7: View Metrics

```bash
curl http://localhost:3000/api/v1/metrics/json
```

## Step 8: Health Check

```bash
curl http://localhost:3000/api/v1/health
```

## That's It! 🎉

Your AsyncFlow platform is running. Next steps:

### Explore the API
- Visit http://localhost:3000/api/docs for interactive API documentation
- Try creating jobs with different priorities and delays
- Pause/resume the queue
- View dead letter jobs

### Monitor Performance
```bash
# Watch logs
docker-compose logs -f

# View API logs
docker-compose logs -f api

# View Worker logs
docker-compose logs -f worker
```

### Run Benchmarks
```bash
# Generate test token first
export JWT_TOKEN=$(node scripts/generate-jwt-token.js | grep "Bearer" | awk '{print $3}')

# Run benchmarks
node scripts/benchmark.js
```

### Stop Services
```bash
docker-compose down
```

## Local Development

Want to develop locally without Docker?

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Infrastructure
```bash
docker-compose up -d postgres redis
```

### 3. Run Migrations
```bash
npm run db:migrate
```

### 4. Start API & Worker
```bash
# Terminal 1
npm run dev:api

# Terminal 2
npm run dev:worker
```

## Troubleshooting

### Port Already in Use
If port 3000, 5432, or 6379 is in use:
```bash
# Check what's using the port
netstat -ano | findstr :3000

# Stop docker-compose and try again
docker-compose down
```

### Database Connection Error
```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Jobs Not Processing
```bash
# Check worker is running
docker-compose ps

# Restart worker
docker-compose restart worker
```

## Documentation

- **API Usage**: See [docs/API_USAGE.md](docs/API_USAGE.md)
- **Deployment**: See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **Architecture**: See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **ADRs**: See [docs/adr/](docs/adr/)

## Project Structure

```
asyncflow/
├── apps/
│   ├── api/          # REST API (NestJS)
│   └── worker/       # Job Processor
├── packages/
│   ├── shared/       # Domain Models
│   ├── contracts/    # Interfaces
│   ├── database/     # Prisma ORM
│   ├── queue/        # BullMQ
│   ├── logger/       # Pino
│   ├── metrics/      # Prometheus
│   ├── config/       # Configuration
│   └── utils/        # Utilities
└── docs/             # Documentation
```

## Key Features Demonstrated

✅ **Clean Architecture** - Separation of concerns  
✅ **SOLID Principles** - Well-structured code  
✅ **Repository Pattern** - Data abstraction  
✅ **Domain Events** - Event-driven design  
✅ **Retry Strategies** - Exponential backoff  
✅ **State Machine** - Job lifecycle  
✅ **Observability** - Logging & metrics  
✅ **API Documentation** - Swagger/OpenAPI  
✅ **Containerization** - Docker  
✅ **Monorepo** - TurboRepo  
✅ **Testing** - Unit & integration tests  

## Technologies Used

- **Runtime**: Node.js 20
- **Language**: TypeScript 5
- **Framework**: NestJS 10
- **Queue**: BullMQ 4
- **Cache**: Redis 7
- **Database**: PostgreSQL 15
- **ORM**: Prisma 5
- **Monorepo**: TurboRepo
- **Testing**: Jest
- **Documentation**: Swagger
- **Logging**: Pino
- **Metrics**: Prometheus

## Support

- GitHub Issues: https://github.com/Rkdev1212/assignment-job-processing-platform/issues
- Documentation: [README.md](README.md)

---

**Built with ❤️ demonstrating production-grade backend engineering**
