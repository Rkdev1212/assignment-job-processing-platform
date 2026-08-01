# Railway Deployment Guide

This guide walks you through deploying the AsyncFlow background worker on Railway.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Step-by-Step Deployment](#step-by-step-deployment)
- [Environment Variables](#environment-variables)
- [Scaling Workers](#scaling-workers)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Railway CLI (Optional)**: Install with `npm i -g @railway/cli`

---

## Quick Start

### Option 1: Deploy via Railway Dashboard (Recommended)

1. Go to [railway.app](https://railway.app) and click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository
4. Railway will auto-detect your project and start deploying

### Option 2: Deploy via Railway CLI

```bash
# Login to Railway
railway login

# Initialize project
railway init

# Link to your project
railway link

# Deploy
railway up
```

---

## Step-by-Step Deployment

### Step 1: Create a New Railway Project

1. Log in to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Provision PostgreSQL"** (adds a database to your project)
4. Click **"Deploy from GitHub repo"** and select your repository

### Step 2: Set Up PostgreSQL Database

Railway will automatically create a PostgreSQL database. You'll see:
- `DATABASE_URL` variable automatically injected
- Database credentials in the service variables

### Step 3: Add Redis Service

1. Click **"New"** in your Railway project
2. Select **"Database"** → **"Add Redis"**
3. Railway will provision Redis and add connection variables

### Step 4: Deploy the API Service

1. In your Railway project, click **"New"** → **"GitHub Repo"**
2. Select your repository
3. Configure the service:
   - **Name**: `asyncflow-api`
   - **Root Directory**: Leave empty (monorepo detected automatically)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node apps/api/dist/main.js`
   - **Dockerfile Path**: `apps/api/Dockerfile` (Railway will auto-detect)

4. Add environment variables (see [Environment Variables](#environment-variables) below)

5. Click **"Deploy"**

### Step 5: Deploy the Worker Service

1. In your Railway project, click **"New"** → **"GitHub Repo"**
2. Select your repository again (you can deploy multiple services from the same repo)
3. Configure the service:
   - **Name**: `asyncflow-worker`
   - **Root Directory**: Leave empty
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node apps/worker/dist/main.js`
   - **Dockerfile Path**: `apps/worker/Dockerfile` (Railway will auto-detect)

4. Add environment variables (see [Environment Variables](#environment-variables) below)

5. Click **"Deploy"**

### Step 6: Configure Networking

Railway services can communicate internally:
- Use service names for internal communication
- API can connect to PostgreSQL and Redis via their internal URLs
- Worker connects to the same PostgreSQL and Redis instances

---

## Environment Variables

### Worker Service Environment Variables

Add these to your Railway worker service:

#### Required Variables

```bash
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
WORKER_ID=worker-railway-1
```

#### Optional Variables

```bash
QUEUE_CONCURRENCY=5
LOG_LEVEL=info
LOG_PRETTY=false
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
```

### API Service Environment Variables

Add these to your Railway API service:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
LOG_LEVEL=info
LOG_PRETTY=false
API_PREFIX=api/v1
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=1000
```

### Railway Variable Interpolation

Railway uses `${{SERVICE.VARIABLE}}` syntax to reference variables from other services:
- `${{Postgres.DATABASE_URL}}` - Auto-injected PostgreSQL connection
- `${{Redis.REDIS_HOST}}` - Redis hostname
- `${{Redis.REDIS_PORT}}` - Redis port
- `${{Redis.REDIS_PASSWORD}}` - Redis password (if set)

---

## Using Railway CLI

### Set Environment Variables via CLI

```bash
# Set individual variables
railway variables set WORKER_ID=worker-railway-1
railway variables set QUEUE_CONCURRENCY=5
railway variables set LOG_LEVEL=info

# Set DATABASE_URL from Postgres service
railway variables set DATABASE_URL='${{Postgres.DATABASE_URL}}'
```

### Deploy via CLI

```bash
# Deploy current directory
railway up

# Deploy specific service
railway up --service asyncflow-worker
```

### View Logs

```bash
# View worker logs
railway logs --service asyncflow-worker

# Follow logs in real-time
railway logs --service asyncflow-worker --follow
```

### Run Database Migrations

```bash
# Connect to your Railway project
railway run npx prisma migrate deploy
```

---

## Dockerfile Configuration

Your existing Dockerfiles should work with Railway. Ensure:

### Worker Dockerfile (`apps/worker/Dockerfile`)

✅ Your existing Dockerfile is Railway-ready!

Railway will:
1. Detect the Dockerfile automatically
2. Build the image
3. Run the container with your environment variables

### If Not Using Dockerfile

If Railway doesn't detect your Dockerfile, you can configure build settings:

**railway.json** (create in project root):
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "apps/worker/Dockerfile"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Scaling Workers

### Vertical Scaling (More Resources)

1. Go to your worker service settings
2. Click **"Settings"** → **"Resources"**
3. Adjust CPU and memory limits

### Horizontal Scaling (Multiple Workers)

Railway Pro plan supports replicas:

1. Go to worker service settings
2. Click **"Settings"** → **"Replicas"**
3. Set number of replicas (e.g., 3 workers)

Each worker will:
- Have a unique container instance
- Process jobs from the same Redis queue
- Use the same PostgreSQL database
- BullMQ handles distributed locking automatically

**Set unique WORKER_IDs** for each replica:
```bash
WORKER_ID=worker-railway-${RAILWAY_REPLICA_ID}
```

Railway provides `RAILWAY_REPLICA_ID` automatically for each replica.

---

## Database Migrations

### Run Migrations After Deployment

Railway doesn't automatically run migrations. You have two options:

#### Option 1: Via Railway CLI

```bash
railway run npx prisma migrate deploy
```

#### Option 2: Add Migration to Start Command

Update your worker service start command:
```bash
npx prisma migrate deploy && node apps/worker/dist/main.js
```

**Note**: This runs migrations every time the service starts. Consider running migrations separately for production.

#### Option 3: Create a Migration Service

Create a one-off service that runs migrations:

1. Add new service in Railway
2. Set build command: `npm install`
3. Set start command: `npx prisma migrate deploy`
4. Deploy once, then stop the service

---

## Monitoring

### Railway Built-in Monitoring

Railway provides:
- **Logs**: Real-time logs for each service
- **Metrics**: CPU, memory, network usage
- **Deployments**: Deployment history and status

### Access Logs

**Via Dashboard:**
1. Click on your worker service
2. Go to **"Deployments"** tab
3. Click on a deployment to view logs

**Via CLI:**
```bash
railway logs --service asyncflow-worker --follow
```

### Health Checks

Add a health check endpoint to your worker (optional):

```typescript
// apps/worker/src/main.ts
import express from 'express';

const app = express();
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', worker: process.env.WORKER_ID });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Worker health check listening on port ${port}`);
});
```

Configure in Railway:
- **Settings** → **"Health Check"**
- **Path**: `/health`
- **Port**: `8080`

### Metrics Endpoint

Your worker can expose Prometheus metrics. Railway can scrape them if you:
1. Expose a metrics endpoint (e.g., `/metrics`)
2. Set up external monitoring (Grafana Cloud, Datadog, etc.)

---

## Troubleshooting

### Worker Not Processing Jobs

**Check logs:**
```bash
railway logs --service asyncflow-worker --follow
```

**Common issues:**
- ✅ Verify `DATABASE_URL` is set correctly
- ✅ Verify `REDIS_HOST` and `REDIS_PORT` are correct
- ✅ Check Redis is running (should auto-deploy with Railway)
- ✅ Verify network connectivity between services

### Database Connection Errors

**Error**: `Can't reach database server`

**Solutions:**
1. Check `DATABASE_URL` variable is using Railway's Postgres service:
   ```bash
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```
2. Verify Postgres service is running in Railway dashboard
3. Check connection string format:
   ```
   postgresql://user:password@host:port/database?schema=public
   ```

### Redis Connection Errors

**Error**: `Redis connection refused`

**Solutions:**
1. Verify Redis service is deployed in Railway
2. Check `REDIS_HOST` and `REDIS_PORT` variables:
   ```bash
   REDIS_HOST=${{Redis.REDIS_HOST}}
   REDIS_PORT=${{Redis.REDIS_PORT}}
   ```
3. Add Redis password if configured:
   ```bash
   REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
   ```

### Build Failures

**Error**: `npm install` fails or times out

**Solutions:**
1. Check your `package.json` and `package-lock.json` are committed
2. Verify Node.js version compatibility (Railway uses Node 20 by default)
3. Check Railway build logs for specific errors

### Out of Memory Errors

**Solutions:**
1. Reduce `QUEUE_CONCURRENCY` (default: 5)
2. Increase memory limit in Railway service settings
3. Upgrade to a higher Railway plan

### Worker Crashes or Restarts

**Check:**
```bash
railway logs --service asyncflow-worker --tail 100
```

**Solutions:**
1. Review error logs for uncaught exceptions
2. Ensure proper error handling in job processors
3. Set restart policy in `railway.json`:
   ```json
   {
     "deploy": {
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

---

## Cost Optimization

### Railway Pricing Tips

1. **Starter Plan ($5/month)**: Good for development/testing
   - 512 MB RAM per service
   - Limited to basic services

2. **Pro Plan ($20/month + usage)**: Recommended for production
   - More resources per service
   - Horizontal scaling support
   - Better performance

3. **Optimize Worker Concurrency**:
   - Lower `QUEUE_CONCURRENCY` = less memory usage
   - Higher concurrency = faster job processing but more resources

4. **Use Sleep Mode** (Starter plan):
   - Workers sleep after inactivity
   - Wake on new jobs (slight delay)

---

## Production Checklist

Before going live:

- [ ] Set `JWT_SECRET` to a strong, random value (32+ characters)
- [ ] Configure `NODE_ENV=production`
- [ ] Run database migrations
- [ ] Set appropriate `QUEUE_CONCURRENCY` (start with 5)
- [ ] Set up monitoring and alerting
- [ ] Configure proper `LOG_LEVEL` (use `info` or `warn`)
- [ ] Test worker processes jobs correctly
- [ ] Set up backups for PostgreSQL (Railway provides automatic backups on Pro plan)
- [ ] Configure restart policies
- [ ] Test failover scenarios
- [ ] Document deployment process for your team

---

## Useful Railway Commands

```bash
# Login
railway login

# Link to project
railway link

# List services
railway service

# Set variables
railway variables set KEY=VALUE

# View logs
railway logs --service asyncflow-worker

# Open service in browser
railway open

# Run command in Railway environment
railway run npm run db:migrate

# Deploy
railway up

# Get service URL
railway domain
```

---

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Railway Templates](https://railway.app/templates)
- [AsyncFlow Architecture Guide](./ARCHITECTURE.md)
- [General Deployment Guide](./DEPLOYMENT.md)

---

## Support

If you encounter issues:

1. Check Railway status: [status.railway.app](https://status.railway.app)
2. Review Railway docs: [docs.railway.app](https://docs.railway.app)
3. Ask in Railway Discord: [discord.gg/railway](https://discord.gg/railway)
4. Check this project's issues on GitHub

---

**Happy Deploying! 🚀**
