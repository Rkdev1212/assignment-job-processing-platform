# Railway Deployment - Copy & Paste Guide

Quick reference for deploying AsyncFlow worker on Railway.

---

## 🚀 Quick Deploy Steps

### 1. Create Project on Railway

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Provision PostgreSQL"**
4. Click **"New"** → **"Add Redis"**

### 2. Deploy Worker Service

1. Click **"New"** → **"GitHub Repo"**
2. Select your repository
3. Name the service: `asyncflow-worker`
4. Railway auto-detects `apps/worker/Dockerfile`

---

## 📋 Environment Variables for Worker

Copy and paste these into Railway worker service variables:

```bash
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
WORKER_ID=worker-railway-${RAILWAY_REPLICA_ID}
QUEUE_CONCURRENCY=5
LOG_LEVEL=info
LOG_PRETTY=false
```

### Optional (if Redis has password):
```bash
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}
```

---

## 📋 Environment Variables for API

Copy and paste these into Railway API service variables:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
JWT_SECRET=your-super-secure-jwt-secret-change-this-min-32-chars
LOG_LEVEL=info
LOG_PRETTY=false
API_PREFIX=api/v1
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=1000
```

---

## 🛠️ Railway CLI Commands

### Install Railway CLI
```bash
npm i -g @railway/cli
```

### Login and Link Project
```bash
railway login
railway link
```

### Set Environment Variables
```bash
railway variables set WORKER_ID=worker-railway-1
railway variables set QUEUE_CONCURRENCY=5
railway variables set DATABASE_URL='${{Postgres.DATABASE_URL}}'
railway variables set REDIS_HOST='${{Redis.REDIS_HOST}}'
railway variables set REDIS_PORT='${{Redis.REDIS_PORT}}'
```

### Deploy
```bash
railway up
```

### View Logs
```bash
railway logs --service asyncflow-worker --follow
```

### Run Database Migrations
```bash
railway run npx prisma migrate deploy
```

---

## 🔧 Service Configuration

### Worker Service Settings

**Name**: `asyncflow-worker`  
**Dockerfile Path**: `apps/worker/Dockerfile`  
**Root Directory**: `.` (project root)  
**Build Command**: Auto-detected  
**Start Command**: Auto-detected from Dockerfile

### API Service Settings

**Name**: `asyncflow-api`  
**Dockerfile Path**: `apps/api/Dockerfile`  
**Root Directory**: `.` (project root)  
**Build Command**: Auto-detected  
**Start Command**: Auto-detected from Dockerfile

---

## 📊 Monitoring Commands

### View Worker Logs
```bash
railway logs --service asyncflow-worker --tail 50
```

### View API Logs
```bash
railway logs --service asyncflow-api --tail 50
```

### Follow Logs in Real-Time
```bash
railway logs --service asyncflow-worker --follow
```

### Check Service Status
```bash
railway status
```

---

## 🐛 Troubleshooting Quick Fixes

### Database Connection Issues
```bash
# Verify DATABASE_URL is set
railway variables --service asyncflow-worker | grep DATABASE_URL

# Should output: DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### Redis Connection Issues
```bash
# Verify Redis variables
railway variables --service asyncflow-worker | grep REDIS

# Should show REDIS_HOST and REDIS_PORT
```

### Worker Not Processing Jobs
```bash
# Check logs for errors
railway logs --service asyncflow-worker --tail 100

# Restart service
railway restart --service asyncflow-worker
```

### Run Migrations
```bash
# From local machine, connected to Railway
railway run npx prisma migrate deploy
```

---

## 🔄 Scaling Workers

### Via Dashboard
1. Go to worker service
2. **Settings** → **"Replicas"**
3. Set number (e.g., 3)

### Via CLI (Pro Plan)
```bash
railway scale --service asyncflow-worker --replicas 3
```

---

## 📦 Deploy New Version

### Automatic (GitHub Push)
```bash
git add .
git commit -m "Update worker"
git push origin main
# Railway auto-deploys on push
```

### Manual (Railway CLI)
```bash
railway up --service asyncflow-worker
```

---

## 🔐 Security Checklist

- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Use `NODE_ENV=production`
- [ ] Enable Redis password if needed
- [ ] Set `LOG_PRETTY=false` for production
- [ ] Review environment variables

---

## 📁 Project Structure

```
your-repo/
├── apps/
│   ├── api/
│   │   ├── Dockerfile          ← Railway uses this
│   │   └── src/
│   └── worker/
│       ├── Dockerfile          ← Railway uses this
│       └── src/
├── packages/
│   ├── database/
│   │   └── prisma/schema.prisma
│   └── ...
├── package.json
└── turbo.json
```

---

## 🌐 Service URLs

After deployment, Railway provides:

- **API URL**: `https://your-service.railway.app`
- **Internal URLs**: Services can communicate via service names
  - Postgres: `${{Postgres.DATABASE_URL}}`
  - Redis: Internal DNS via `REDIS_HOST`

---

## 💰 Railway Plans

### Hobby Plan ($5/month)
- Good for development
- 512 MB RAM per service
- Limited concurrency

### Pro Plan ($20/month + usage)
- **Recommended for production**
- More resources
- Horizontal scaling
- Better performance

---

## 📚 Quick Links

- [Railway Dashboard](https://railway.app/dashboard)
- [Railway Docs](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Project Deployment Guide](./docs/RAILWAY_DEPLOYMENT.md)

---

## ✅ Deployment Verification

After deploying, verify everything works:

```bash
# Check worker is running
railway logs --service asyncflow-worker --tail 20

# Should see logs like:
# "Worker started successfully"
# "Connected to Redis"
# "Connected to database"
# "Listening for jobs..."

# Create a test job via API
curl -X POST https://your-api.railway.app/api/v1/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"type": "email", "data": {"to": "test@example.com"}}'

# Check worker processes the job
railway logs --service asyncflow-worker --follow
```

---

**Need more help?** See the full guide: [docs/RAILWAY_DEPLOYMENT.md](./docs/RAILWAY_DEPLOYMENT.md)

🚀 **Happy deploying!**
