# AsyncFlow Deployment Guide

## Table of Contents
- [Docker Deployment](#docker-deployment)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Docker Deployment

### Quick Start

1. **Start all services:**
```bash
docker-compose up
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- API Server (port 3000)
- Worker Process

2. **Access the application:**
- API: http://localhost:3000/api/v1
- Swagger Docs: http://localhost:3000/api/docs
- Health Check: http://localhost:3000/api/v1/health

3. **Stop services:**
```bash
docker-compose down
```

### Production Docker Build

**Build API:**
```bash
docker build -f apps/api/Dockerfile -t asyncflow-api:latest .
```

**Build Worker:**
```bash
docker build -f apps/worker/Dockerfile -t asyncflow-worker:latest .
```

**Run with environment variables:**
```bash
docker run -d \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_HOST=redis \
  -e JWT_SECRET=your-secret \
  -p 3000:3000 \
  asyncflow-api:latest
```

---

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- npm 9+

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start PostgreSQL and Redis:**
```bash
docker-compose up -d postgres redis
```

4. **Run database migrations:**
```bash
npm run db:migrate
```

5. **Generate Prisma client:**
```bash
npm run db:generate
```

6. **Start API (in one terminal):**
```bash
npm run dev:api
```

7. **Start Worker (in another terminal):**
```bash
npm run dev:worker
```

### Development Scripts

```bash
# Build all packages
npm run build

# Run tests
npm test
npm run test:unit
npm run test:integration
npm run test:cov

# Lint code
npm run lint

# Format code
npm run format

# Database operations
npm run db:migrate
npm run db:generate
npm run db:studio
npm run db:seed

# Generate JWT token
node scripts/generate-jwt-token.js

# Run benchmarks
npm run benchmark
```

---

## Production Deployment

### Environment Variables

**Required:**
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_HOST=redis-host
REDIS_PORT=6379
JWT_SECRET=your-production-secret-min-32-chars
```

**Optional:**
```bash
PORT=3000
API_PREFIX=api/v1
REDIS_PASSWORD=redis-password
QUEUE_CONCURRENCY=10
LOG_LEVEL=info
LOG_PRETTY=false
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=1000
```

### Security Checklist

- [ ] Change JWT_SECRET to a strong, random value
- [ ] Use HTTPS in production
- [ ] Enable Redis password authentication
- [ ] Use database connection pooling
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Use environment-specific secrets
- [ ] Enable audit logging
- [ ] Set up backup strategy

### Database Setup

**Run migrations:**
```bash
cd packages/database
npx prisma migrate deploy
```

**Create indexes:**
Indexes are created automatically by migrations.

**Connection Pooling:**
Use PgBouncer or similar for production workloads.

### Scaling

**Horizontal Scaling:**

1. **API Servers:**
   - Run multiple API instances behind a load balancer
   - Use sticky sessions or stateless design (JWT)
   - Share Redis and PostgreSQL

2. **Workers:**
   - Run multiple worker instances
   - Each worker processes jobs concurrently
   - BullMQ handles distributed locking

**Example: 3 API instances, 5 workers**
```bash
# API instances
docker run -d --name api-1 -p 3001:3000 asyncflow-api
docker run -d --name api-2 -p 3002:3000 asyncflow-api
docker run -d --name api-3 -p 3003:3000 asyncflow-api

# Worker instances
docker run -d --name worker-1 -e WORKER_ID=worker-1 asyncflow-worker
docker run -d --name worker-2 -e WORKER_ID=worker-2 asyncflow-worker
docker run -d --name worker-3 -e WORKER_ID=worker-3 asyncflow-worker
docker run -d --name worker-4 -e WORKER_ID=worker-4 asyncflow-worker
docker run -d --name worker-5 -e WORKER_ID=worker-5 asyncflow-worker
```

### Load Balancer Configuration

**Nginx Example:**
```nginx
upstream asyncflow_api {
    least_conn;
    server api-1:3000;
    server api-2:3000;
    server api-3:3000;
}

server {
    listen 80;
    server_name api.asyncflow.com;

    location / {
        proxy_pass http://asyncflow_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## Kubernetes Deployment

### Basic Deployment

**Namespace:**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: asyncflow
```

**ConfigMap:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: asyncflow-config
  namespace: asyncflow
data:
  NODE_ENV: "production"
  API_PREFIX: "api/v1"
  REDIS_HOST: "redis-service"
  QUEUE_CONCURRENCY: "5"
```

**Secret:**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: asyncflow-secret
  namespace: asyncflow
type: Opaque
data:
  DATABASE_URL: <base64-encoded>
  JWT_SECRET: <base64-encoded>
```

**API Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: asyncflow-api
  namespace: asyncflow
spec:
  replicas: 3
  selector:
    matchLabels:
      app: asyncflow-api
  template:
    metadata:
      labels:
        app: asyncflow-api
    spec:
      containers:
      - name: api
        image: asyncflow-api:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: asyncflow-config
        - secretRef:
            name: asyncflow-secret
        livenessProbe:
          httpGet:
            path: /api/v1/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/v1/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

**Worker Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: asyncflow-worker
  namespace: asyncflow
spec:
  replicas: 5
  selector:
    matchLabels:
      app: asyncflow-worker
  template:
    metadata:
      labels:
        app: asyncflow-worker
    spec:
      containers:
      - name: worker
        image: asyncflow-worker:latest
        envFrom:
        - configMapRef:
            name: asyncflow-config
        - secretRef:
            name: asyncflow-secret
```

**Service:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: asyncflow-api-service
  namespace: asyncflow
spec:
  selector:
    app: asyncflow-api
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

---

## Monitoring

### Metrics

**Prometheus Integration:**
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'asyncflow'
    static_configs:
      - targets: ['asyncflow-api:3000']
    metrics_path: '/api/v1/metrics'
```

**Key Metrics to Monitor:**
- `jobs_processed_total`: Total jobs processed
- `jobs_completed_total`: Successfully completed jobs
- `jobs_failed_total`: Failed jobs
- `queue_depth`: Current queue size
- `worker_busy`: Active workers
- `job_processing_time_seconds`: Processing latency

### Logging

**Structured JSON logs** include:
- `requestId`: Unique request identifier
- `correlationId`: Cross-service correlation
- `jobId`: Job identifier
- `workerId`: Worker identifier
- `duration`: Operation duration
- `timestamp`: ISO 8601 timestamp

**Log Aggregation:**
Use ELK Stack, Grafana Loki, or CloudWatch Logs.

### Alerting

**Recommended Alerts:**
- Queue depth > 1000
- Worker availability < 50%
- Job failure rate > 10%
- API response time > 1s (P95)
- Database connection errors

---

## Troubleshooting

### Common Issues

**1. Database Connection Errors**
```
Error: Can't reach database server
```
**Solution:**
- Check DATABASE_URL
- Verify network connectivity
- Check PostgreSQL is running
- Verify credentials

**2. Redis Connection Errors**
```
Error: Redis connection refused
```
**Solution:**
- Check REDIS_HOST and REDIS_PORT
- Verify Redis is running
- Check firewall rules

**3. Jobs Not Processing**
```
Jobs stuck in QUEUED state
```
**Solution:**
- Check worker is running
- Check worker logs for errors
- Verify queue is not paused
- Check Redis connectivity

**4. High Memory Usage**
```
Worker consuming excessive memory
```
**Solution:**
- Reduce QUEUE_CONCURRENCY
- Check for memory leaks
- Monitor job payload sizes
- Restart workers periodically

### Debug Mode

Enable detailed logging:
```bash
LOG_LEVEL=debug npm run dev:api
```

### Health Check Endpoints

```bash
# Quick health check
curl http://localhost:3000/api/v1/health

# Detailed system status
curl http://localhost:3000/api/v1/metrics/json
```

### Database Queries

```sql
-- Check job statistics
SELECT status, COUNT(*) FROM jobs GROUP BY status;

-- Find stuck jobs
SELECT * FROM jobs 
WHERE status = 'PROCESSING' 
AND "startedAt" < NOW() - INTERVAL '1 hour';

-- Check recent failures
SELECT * FROM jobs 
WHERE status = 'FAILED' 
ORDER BY "updatedAt" DESC 
LIMIT 10;
```

---

## Backup & Recovery

### Database Backup

```bash
# Backup
pg_dump -h localhost -U asyncflow asyncflow > backup.sql

# Restore
psql -h localhost -U asyncflow asyncflow < backup.sql
```

### Redis Backup

Redis uses RDB/AOF persistence. Configure in docker-compose.yml:
```yaml
redis:
  command: redis-server --appendonly yes
  volumes:
    - redis_data:/data
```

---

## Performance Tuning

### Database
- Enable connection pooling
- Create appropriate indexes
- Tune PostgreSQL settings
- Archive old jobs

### Redis
- Use Redis cluster for high availability
- Monitor memory usage
- Configure eviction policies

### API
- Enable HTTP/2
- Use compression
- Implement caching
- Optimize query patterns

### Workers
- Tune QUEUE_CONCURRENCY based on workload
- Monitor CPU and memory
- Use dedicated worker pools for different job types
