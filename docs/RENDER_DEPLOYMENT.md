# Deploy AsyncFlow to Render (FREE)

## Overview

Render offers a generous free tier perfect for hosting AsyncFlow. You'll deploy:
- ✅ PostgreSQL Database (FREE)
- ✅ Redis Instance (FREE)
- ✅ API Web Service (FREE)
- ✅ Worker Background Service (FREE)

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

## Step 3: Create Redis Instance

1. **Dashboard** → Click "New +" → Select "Redis"

2. **Configure Redis:**
   ```
   Name: asyncflow-redis
   Region: Same as database
   ```

3. **Plan:** Select **Free** (25MB storage, eviction when full)

4. **Create Redis** → Wait ~1 minute

5. **Copy Redis URL:**
   - Internal Redis URL (starts with `redis://`)

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

4. **Dockerfile Path:**
   ```
   apps/api/Dockerfile
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
   
   # Redis (use Internal Redis URL from Step 3)
   REDIS_HOST=red-XXXX.render.com
   REDIS_PORT=6379
   
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

## Step 5: Deploy Worker Service

1. **Dashboard** → Click "New +" → Select "Background Worker"

2. **Connect Repository:**
   - Same repository: `assignment-job-processing-platform`

3. **Configure Worker:**
   ```
   Name: asyncflow-worker
   Region: Same as others
   Branch: main
   Root Directory: (leave empty)
   Runtime: Docker
   ```

4. **Dockerfile Path:**
   ```
   apps/worker/Dockerfile
   ```

5. **Instance Type:** Select **Free**

6. **Environment Variables:**
   
   Copy the SAME environment variables from API, plus:
   ```bash
   WORKER_ID=worker-render-1
   WORKER_HEARTBEAT_INTERVAL=30000
   WORKER_GRACEFUL_SHUTDOWN_TIMEOUT=30000
   ```

7. **Click "Create Background Worker"**

8. **Wait for deployment** (~5 minutes)

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

### Redis
- ✅ 25 MB storage
- ⚠️ Eviction when full (LRU)
- ⚠️ No persistence guarantees

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
