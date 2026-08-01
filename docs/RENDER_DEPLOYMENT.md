# Deploy AsyncFlow to Render (FREE)

## Overview

You can host AsyncFlow completely FREE using:
- ✅ PostgreSQL Database on Render (FREE)
- ✅ Redis on Upstash (FREE - 10,000 commands/day)
- ✅ API Web Service on Render (FREE)
- ✅ Worker Background Service on Render (FREE)

**Total Cost: $0/month** (with limitations)

## Prerequisites

1. GitHub account with your AsyncFlow repository
2. Render account (sign up at https://render.com)

## Step 1: Sign Up for Render

1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended for easy deployments)
4. Authorize Render to access your repositories

## Step 2: Create PostgreSQL Database

1. **Dashboard** → Click "New +" → Select "PostgreSQL"

2. **Configure Database:**
   ```
   Name: asyncflow-db
   Database: asyncflow
   User: asyncflow
   Region: Choose closest to you
   PostgreSQL Version: 15
   ```

3. **Plan:** Select **Free** (limited to 1GB storage, 90 days retention)

4. **Create Database** → Wait ~2 minutes for provisioning

5. **Copy Connection Details:**
   - Internal Database URL (for services)
   - External Database URL (for local testing)

## Step 3: Create Redis (Using Upstash - FREE)

⚠️ **Note:** Render no longer offers free Redis. We'll use Upstash Redis (FREE tier).

1. **Go to Upstash:** https://upstash.com

2. **Sign up** (Free account, no credit card required)

3. **Create Database:**
   - Click "Create Database"
   - Name: `asyncflow-redis`
   - Type: Regional
   - Region: Choose closest to your Render region
   - Select **Free** tier (10,000 commands/day)

4. **Copy Connection Details:**
   - Click on your database
   - Scroll to "REST API" section
   - Copy these values:
     ```
     UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
     UPSTASH_REDIS_REST_TOKEN=xxx
     ```
   - Also note:
     ```
     Endpoint: xxx.upstash.io
     Port: 6379
     Password: your-password-here
     ```

## Step 4: Deploy API Service

1. **Dashboard** → Click "New +" → Select "Web Service"

2. **Connect Repository:**
   - Select your GitHub repository
   - Repository: `assignment-job-processing-platform`

3. **Configure Service:**
   ```
   Name: asyncflow-api
   Region: Same as database/redis
   Branch: main
   Root Directory: (leave empty)
   Runtime: Docker
   ```

4. **Docker Configuration:**
   ```
   Dockerfile Path: apps/api/Dockerfile
   Docker Context: .
   Build Command: (leave blank - Docker handles build)
   Start Command: (leave blank - Dockerfile CMD handles start)
   ```

5. **Instance Type:** Select **Free** (512MB RAM, auto-sleep after 15 min)

6. **Environment Variables:** Click "Add Environment Variable"
   
   Add these variables:
   ```bash
   NODE_ENV=production
   PORT=3000
   API_PREFIX=api/v1
   
   # Database (use Internal Database URL from Step 2)
   DATABASE_URL=postgresql://asyncflow:XXXX@dpg-XXXX.render.com/asyncflow
   
   # Redis (use Upstash details from Step 3)
   REDIS_HOST=perfect-unicorn-12345.upstash.io
   REDIS_PORT=6379
   REDIS_PASSWORD=your-upstash-password-here
   REDIS_TLS=true
   
   # JWT Secret (generate a strong secret)
   JWT_SECRET=your-super-secret-change-this-to-random-string
   JWT_EXPIRATION=24h
   
   # Queue
   QUEUE_NAME=asyncflow-jobs
   QUEUE_CONCURRENCY=3
   QUEUE_MAX_ATTEMPTS=3
   
   # Rate Limiting
   RATE_LIMIT_TTL=60
   RATE_LIMIT_MAX=100
   
   # Logging
   LOG_LEVEL=info
   LOG_PRETTY=false
   
   # Metrics
   METRICS_ENABLED=true
   
   # Retry
   RETRY_STRATEGY=exponential
   RETRY_BASE_DELAY=1000
   RETRY_MAX_DELAY=60000
   RETRY_MULTIPLIER=2
   ```

7. **Click "Create Web Service"**

8. **Wait for deployment** (~5-10 minutes first time)

## Step 5: Deploy Worker Service (Background Worker with Docker)

The worker is deployed as a **Background Worker** using your existing `apps/worker/Dockerfile`.

### 5.1 Create Background Worker

1. **Dashboard** → Click "New +" → Select **"Background Worker"**

2. **Connect Repository:**
   - Select your GitHub repository
   - Repository: `assignment-job-processing-platform` (same as API)
   - You can deploy multiple services from the same repository!

3. **Configure Worker:**
   ```
   Name: asyncflow-worker
   Region: Same as database/API (for lower latency)
   Branch: main
   Root Directory: (leave empty - uses repo root)
   Runtime: Docker
   ```

### 5.2 Docker Configuration

Render will automatically detect your Dockerfile. Configure:

```
Dockerfile Path: apps/worker/Dockerfile
Docker Context: . (project root)
Docker Build Context Directory: . (project root)
```

**Important:** 
- ✅ Leave **Build Command** blank (Docker handles the build)
- ✅ Leave **Start Command** blank (Dockerfile CMD is used)
- ✅ Render uses your `apps/worker/Dockerfile` which already has all build steps

### 5.3 Select Instance Type

**Instance Type:** Select **Free** 
- 512 MB RAM
- Shared CPU
- ⚠️ Limited to 400 hours/month on free tier
- Background workers don't auto-sleep (they run continuously)

### 5.4 Add Environment Variables

Click **"Add Environment Variable"** and add these:

```bash
# Same as API service
NODE_ENV=production

# Database (use Internal Database URL from Step 2)
DATABASE_URL=postgresql://asyncflow:XXXX@dpg-XXXX.render.com/asyncflow

# Redis (Upstash)
REDIS_HOST=perfect-unicorn-12345.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-upstash-password-here
REDIS_TLS=true

# Worker-specific
WORKER_ID=worker-render-1
QUEUE_NAME=asyncflow-jobs
QUEUE_CONCURRENCY=3
QUEUE_MAX_ATTEMPTS=3

# Optional worker settings
WORKER_HEARTBEAT_INTERVAL=30000
WORKER_GRACEFUL_SHUTDOWN_TIMEOUT=30000

# Logging
LOG_LEVEL=info
LOG_PRETTY=false

# Retry strategy
RETRY_STRATEGY=exponential
RETRY_BASE_DELAY=1000
RETRY_MAX_DELAY=60000
RETRY_MULTIPLIER=2
```

**Pro Tip:** You can copy most variables from the API service to maintain consistency.

### 5.5 Deploy

1. **Click "Create Background Worker"**
2. Render will:
   - Clone your repository
   - Build the Docker image using `apps/worker/Dockerfile`
   - Start the container
   - Stream logs to dashboard

3. **Wait for deployment** (~5-10 minutes first time)

### 5.6 Verify Worker is Running

1. Go to your worker service in Render dashboard
2. Click **"Logs"** tab
3. You should see:
   ```
   Worker started successfully
   Connected to Redis
   Connected to database
   Listening for jobs on queue: asyncflow-jobs
   Worker ID: worker-render-1
   ```

### 5.7 Deploy Multiple Workers (Optional)

To scale horizontally, create additional worker services:

1. Repeat steps 5.1-5.5
2. Use different names: `asyncflow-worker-2`, `asyncflow-worker-3`
3. Set unique `WORKER_ID` for each: `worker-render-2`, `worker-render-3`
4. All workers share the same Redis queue and PostgreSQL database
5. BullMQ handles distributed locking automatically

**Note:** Each additional worker counts toward your 400 free hours/month limit.

## Step 6: Run Database Migration

After API is deployed, you need to run migrations:

1. Go to **asyncflow-api** service
2. Click **"Shell"** tab
3. Run migration command:
   ```bash
   cd packages/database
   npx prisma migrate deploy
   ```

## Step 7: Test Your Deployment

### Access API

Your API will be available at:
```
https://asyncflow-api-XXXX.onrender.com
```

### Test Endpoints

1. **Health Check:**
   ```bash
   curl https://asyncflow-api-XXXX.onrender.com/api/v1/health
   ```

2. **Swagger Documentation:**
   ```
   https://asyncflow-api-XXXX.onrender.com/api/docs
   ```

3. **Metrics:**
   ```bash
   curl https://asyncflow-api-XXXX.onrender.com/api/v1/metrics
   ```

## Step 8: Generate JWT Token

To create jobs, you need a JWT token:

1. Open **Shell** in asyncflow-api
2. Run:
   ```bash
   node scripts/generate-jwt-token.js
   ```
3. Copy the token

## Step 9: Create Your First Job

```bash
curl -X POST https://asyncflow-api-XXXX.onrender.com/api/v1/jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email.send",
    "payload": {
      "to": "test@example.com",
      "subject": "Hello from Render!"
    }
  }'
```

## Free Tier Limitations

### PostgreSQL
- ✅ 1 GB storage
- ✅ Shared CPU
- ⚠️ Expires after 90 days (need to create new one)
- ⚠️ No automated backups

### Redis (Upstash)
- ✅ 10,000 commands/day FREE
- ✅ 256 MB storage
- ✅ Global edge locations
- ✅ TLS encryption
- ⚠️ Rate limited after 10k commands

### Web Service (API)
- ✅ 512 MB RAM
- ✅ Shared CPU
- ⚠️ Spins down after 15 min inactivity
- ⚠️ Cold start ~30 seconds
- ✅ 750 hours/month free

### Background Worker
- ✅ 512 MB RAM
- ✅ Shared CPU
- ✅ Runs continuously
- ⚠️ Limited to 400 hours/month on free tier

## Important Notes

### Auto-Sleep
- Free web services sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds (cold start)
- To keep it awake: Use a cron job to ping every 10 minutes

### Database Expiration
- Free PostgreSQL expires after 90 days
- Export data before expiration
- Create a new database and restore

### Monitoring

1. **View Logs:**
   - Click on service → "Logs" tab
   - Real-time streaming logs

2. **Metrics:**
   - Click on service → "Metrics" tab
   - CPU, Memory, Response times

## Troubleshooting

### Service Won't Start

**Check Logs:**
```
Dashboard → Service → Logs
```

**Common Issues:**
1. Missing environment variables
2. Wrong DATABASE_URL format
3. Redis connection failed
4. Build errors

### Database Connection Failed

1. Verify DATABASE_URL is correct
2. Check database is running
3. Ensure using **Internal URL** not External

### Worker Not Processing Jobs

1. Check worker logs
2. Verify REDIS_HOST is correct
3. Ensure worker is running (not crashed)

## Upgrade Options

If you need more resources:

### Starter Plan ($7/month per service)
- No sleep (always on)
- More RAM (512MB → 2GB)
- Faster cold starts
- Priority support

### PostgreSQL Paid ($7/month)
- 10 GB storage
- Continuous backups
- No expiration
- Point-in-time recovery

### Redis Paid ($10/month)
- 1 GB storage
- Persistence
- High availability

## Alternative: Keep-Alive Service

To prevent API from sleeping, create a simple cron job:

**Using Cron-Job.org (FREE):**

1. Go to https://cron-job.org
2. Create account
3. Add new cron job:
   ```
   URL: https://asyncflow-api-XXXX.onrender.com/api/v1/health
   Interval: Every 10 minutes
   ```

## Production Recommendations

For production use beyond free tier:

1. ✅ Upgrade to paid PostgreSQL ($7/mo)
2. ✅ Upgrade API to Starter ($7/mo)
3. ✅ Set up monitoring/alerting
4. ✅ Configure backups
5. ✅ Use environment-specific secrets
6. ✅ Enable HTTPS (included free)

## Useful Commands

### View Service Logs
```bash
# From Render dashboard
Dashboard → Service → Logs
```

### SSH into Service
```bash
# From Render dashboard
Dashboard → Service → Shell
```

### Restart Service
```bash
# From Render dashboard
Dashboard → Service → Manual Deploy → Deploy
```

### Run Migrations
```bash
cd packages/database
npx prisma migrate deploy
npx prisma generate
```

## Summary

**Total Cost: $0/month**

Services running:
- ✅ PostgreSQL (1GB, 90 days)
- ✅ Redis (25MB)
- ✅ API (512MB, sleeps after 15 min)
- ✅ Worker (512MB, 400 hours/month)

**API URL:** `https://asyncflow-api-XXXX.onrender.com`

Perfect for:
- Development
- Testing
- Portfolio projects
- Low-traffic applications

---

**Next Steps:**
1. Add your live API URL to README.md
2. Test all endpoints via Swagger
3. Monitor logs for any issues
4. Share your deployed API with others!

🎉 **Your AsyncFlow platform is now live on the internet!**
