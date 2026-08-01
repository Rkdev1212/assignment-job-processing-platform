# AsyncFlow API Usage Guide

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication

Protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Generate Test Token
```bash
node scripts/generate-jwt-token.js
```

## Endpoints

### 1. Create Job

Create a new asynchronous job.

**Endpoint:** `POST /jobs`  
**Auth:** Required  

**Request Body:**
```json
{
  "type": "email.send",
  "payload": {
    "to": "user@example.com",
    "subject": "Welcome",
    "body": "Welcome to AsyncFlow!"
  },
  "priority": 1,
  "maxAttempts": 3,
  "delay": 0,
  "runAt": "2024-12-31T23:59:59Z"
}
```

**Fields:**
- `type` (required): Job type identifier
- `payload` (required): Job-specific data
- `priority` (optional): 0-10, higher = more priority (default: 0)
- `maxAttempts` (optional): Maximum retry attempts (default: 3)
- `delay` (optional): Delay in milliseconds before processing (default: 0)
- `runAt` (optional): Schedule job for specific time

**Example:**
```bash
curl -X POST http://localhost:3000/api/v1/jobs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email.send",
    "payload": {
      "to": "test@example.com",
      "subject": "Test"
    }
  }'
```

**Response:** `201 Created`
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "type": "email.send",
  "payload": {
    "to": "test@example.com",
    "subject": "Test"
  },
  "status": "QUEUED",
  "priority": 0,
  "attempts": 0,
  "maxAttempts": 3,
  "delay": 0,
  "runAt": null,
  "workerId": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "startedAt": null,
  "completedAt": null,
  "executionTime": null,
  "lastError": null,
  "correlationId": "abc-123-def"
}
```

---

### 2. Get Job

Retrieve job details by ID.

**Endpoint:** `GET /jobs/:id`  
**Auth:** Not required

**Example:**
```bash
curl http://localhost:3000/api/v1/jobs/123e4567-e89b-12d3-a456-426614174000
```

**Response:** `200 OK`
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "type": "email.send",
  "status": "COMPLETED",
  "attempts": 1,
  "executionTime": 1523,
  "completedAt": "2024-01-01T00:00:15.000Z"
}
```

---

### 3. List Jobs

List jobs with filtering and pagination.

**Endpoint:** `GET /jobs`  
**Auth:** Not required

**Query Parameters:**
- `status`: Filter by status (QUEUED, PROCESSING, COMPLETED, FAILED, etc.)
- `type`: Filter by job type
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sortBy`: Sort field (default: createdAt)
- `order`: Sort order (asc/desc, default: desc)

**Example:**
```bash
curl "http://localhost:3000/api/v1/jobs?status=COMPLETED&page=1&limit=10"
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "type": "email.send",
      "status": "COMPLETED"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

---

### 4. Cancel Job

Cancel a pending or processing job.

**Endpoint:** `DELETE /jobs/:id`  
**Auth:** Required

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/v1/jobs/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:** `200 OK`
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "CANCELLED"
}
```

---

### 5. Pause Queue

Pause job processing.

**Endpoint:** `POST /queue/pause`  
**Auth:** Required

**Example:**
```bash
curl -X POST http://localhost:3000/api/v1/queue/pause \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:** `200 OK`
```json
{
  "message": "Queue paused successfully"
}
```

---

### 6. Resume Queue

Resume job processing.

**Endpoint:** `POST /queue/resume`  
**Auth:** Required

**Example:**
```bash
curl -X POST http://localhost:3000/api/v1/queue/resume \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:** `200 OK`
```json
{
  "message": "Queue resumed successfully"
}
```

---

### 7. Queue Status

Get current queue statistics.

**Endpoint:** `GET /queue/status`  
**Auth:** Required

**Example:**
```bash
curl http://localhost:3000/api/v1/queue/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:** `200 OK`
```json
{
  "isPaused": false,
  "waiting": 45,
  "active": 5,
  "completed": 1523,
  "failed": 12,
  "delayed": 8
}
```

---

### 8. Metrics

Get Prometheus-formatted metrics.

**Endpoint:** `GET /metrics`  
**Auth:** Not required

**Example:**
```bash
curl http://localhost:3000/api/v1/metrics
```

**Response:** `200 OK` (text/plain)
```
# HELP jobs_processed_total Total number of jobs processed
# TYPE jobs_processed_total counter
jobs_processed_total 1000

# HELP jobs_completed_total Total number of jobs completed successfully
# TYPE jobs_completed_total counter
jobs_completed_total 950
```

**JSON Format:**
```bash
curl http://localhost:3000/api/v1/metrics/json
```

**Response:** `200 OK`
```json
{
  "jobsProcessedTotal": 1000,
  "jobsCompletedTotal": 950,
  "jobsFailedTotal": 30,
  "jobsRetryTotal": 20,
  "queueDepth": 45,
  "workerCount": 3,
  "workerBusy": 2,
  "averageProcessingTime": 1.5,
  "successRate": 95.0,
  "deadLetterJobs": 5
}
```

---

### 9. Health Check

Check system health.

**Endpoint:** `GET /health`  
**Auth:** Not required

**Example:**
```bash
curl http://localhost:3000/api/v1/health
```

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "responseTime": "45ms",
  "uptime": 3600,
  "memory": {
    "used": 256,
    "total": 512
  },
  "checks": {
    "database": {
      "status": "healthy"
    },
    "redis": {
      "status": "healthy"
    },
    "queue": {
      "status": "healthy",
      "isPaused": false,
      "waiting": 10,
      "active": 2
    }
  }
}
```

---

## Job Status Flow

```
QUEUED → PROCESSING → COMPLETED
           ↓
         FAILED → RETRYING → PROCESSING
           ↓
       DEAD_LETTER

CANCELLED (from any state except COMPLETED)
```

## Error Responses

**400 Bad Request**
```json
{
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/jobs",
  "method": "POST",
  "message": "Validation failed",
  "correlationId": "abc-123"
}
```

**401 Unauthorized**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**404 Not Found**
```json
{
  "statusCode": 404,
  "message": "Job with ID xyz not found"
}
```

## Rate Limiting

- Default: 100 requests per 60 seconds per IP
- Exceeded limit returns `429 Too Many Requests`

## Swagger Documentation

Interactive API documentation available at:
```
http://localhost:3000/api/docs
```
