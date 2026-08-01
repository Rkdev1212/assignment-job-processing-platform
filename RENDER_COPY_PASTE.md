# 🚀 Copy-Paste Environment Variables for Render

## ✅ Complete Setup - Ready to Deploy!

### For API Service (Copy ALL of these):

```bash
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1
DATABASE_URL=postgresql://job_processing_platform_user:AAYPBGUUbE1qrpQRaI17emkNHRciA2F1@dpg-d9mpmodaeets73agosf0-a/job_processing_platform
REDIS_HOST=grown-chimp-86744.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=gQAAAAAAAVLYAAIgcDExMTQ3ZDMwMGMzZTk0ZmE5YTEyNTMxYmRlYjQ0ODYxMw
REDIS_TLS=true
REDIS_DB=0
QUEUE_NAME=asyncflow-jobs
QUEUE_CONCURRENCY=3
QUEUE_MAX_ATTEMPTS=3
JWT_SECRET=m59iB2P7MWn1SOFKeakxCET0qGAysUlIbdXYHpDVvgJt346LQZ8uowfRrczhNj
JWT_EXPIRATION=24h
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
LOG_LEVEL=info
LOG_PRETTY=false
METRICS_ENABLED=true
RETRY_STRATEGY=exponential
RETRY_BASE_DELAY=1000
RETRY_MAX_DELAY=60000
RETRY_MULTIPLIER=2
```

### For Worker Service (Copy ALL of these):

```bash
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1
DATABASE_URL=postgresql://job_processing_platform_user:AAYPBGUUbE1qrpQRaI17emkNHRciA2F1@dpg-d9mpmodaeets73agosf0-a/job_processing_platform
REDIS_HOST=grown-chimp-86744.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=gQAAAAAAAVLYAAIgcDExMTQ3ZDMwMGMzZTk0ZmE5YTEyNTMxYmRlYjQ0ODYxMw
REDIS_TLS=true
REDIS_DB=0
QUEUE_NAME=asyncflow-jobs
QUEUE_CONCURRENCY=3
QUEUE_MAX_ATTEMPTS=3
JWT_SECRET=m59iB2P7MWn1SOFKeakxCET0qGAysUlIbdXYHpDVvgJt346LQZ8uowfRrczhNj
JWT_EXPIRATION=24h
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
LOG_LEVEL=info
LOG_PRETTY=false
METRICS_ENABLED=true
RETRY_STRATEGY=exponential
RETRY_BASE_DELAY=1000
RETRY_MAX_DELAY=60000
RETRY_MULTIPLIER=2
WORKER_ID=worker-render-1
WORKER_HEARTBEAT_INTERVAL=30000
WORKER_GRACEFUL_SHUTDOWN_TIMEOUT=30000
```

---

## 📋 How to Add in Render:

### ⚙️ Service Configuration First

**Before adding environment variables, configure your service:**

#### API Service Settings:
- **Name:** asyncflow-api
- **Environment:** Docker
- **Dockerfile Path:** `apps/api/Dockerfile`
- **Docker Context:** `.` (root directory)
- **Build Command:** (leave blank - Docker handles it)
- **Start Command:** (leave blank - Dockerfile CMD handles it)

#### Worker Service Settings:
- **Name:** asyncflow-worker
- **Environment:** Docker
- **Dockerfile Path:** `apps/worker/Dockerfile`
- **Docker Context:** `.` (root directory)
- **Build Command:** (leave blank - Docker handles it)
- **Start Command:** (leave blank - Dockerfile CMD handles it)

⚠️ **Don't use `yarn install; yarn build` for Docker deployments!**

---

### Adding Environment Variables:

### Method 1: Add from .env (Fastest)

1. Go to your service in Render
2. Click **"Environment"** tab
3. Click **"Add from .env"**
4. Paste the entire block above
5. Click **"Save Changes"**

### Method 2: Add Manually (One by one)

1. Go to your service in Render
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. Add each variable:
   - Key: `NODE_ENV`
   - Value: `production`
5. Repeat for all variables
6. Click **"Save Changes"**

---

## ⚠️ Important Notes:

### DATABASE_URL
- ✅ Using **internal** URL (no `.oregon-postgres.render.com`)
- This is faster and free bandwidth within Render

### REDIS_PASSWORD
- ✅ Your Upstash Redis password (starts with `gQAAA...`)
- ✅ TLS is enabled (`REDIS_TLS=true`)

### JWT_SECRET
- ✅ Generated secure random string (64 characters)
- ⚠️ Keep this secret! Don't share publicly

---

## 🧪 After Adding Variables:

1. **Save Changes** - Render will automatically redeploy
2. **Wait 3-5 minutes** for deployment
3. **Check Logs** - Click "Logs" tab to see if any errors
4. **Test API** - Go to: `https://your-service-name.onrender.com/api/v1/health`

---

## ✅ Verification Checklist:

- [ ] API Service has all 22 environment variables
- [ ] Worker Service has all 25 environment variables (includes WORKER_* vars)
- [ ] Both services deployed successfully (check Logs)
- [ ] API health endpoint responds: `/api/v1/health`
- [ ] Swagger docs accessible: `/api/docs`

---

## 🎯 Quick Test After Deployment:

### 1. Check Health Endpoint
```bash
curl https://your-api-name.onrender.com/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "redis": "connected"
}
```

### 2. Check Swagger Docs
Open in browser:
```
https://your-api-name.onrender.com/api/docs
```

### 3. Check Metrics
```bash
curl https://your-api-name.onrender.com/api/v1/metrics
```

---

## 🚨 Troubleshooting:

### "Database connection failed"
- Verify `DATABASE_URL` is using **internal** URL (no `.oregon-postgres.render.com`)
- Check PostgreSQL is running in Render Dashboard

### "Redis connection failed"
- Verify `REDIS_TLS=true`
- Check `REDIS_PASSWORD` is correct
- Check Upstash Redis is active

### "Service won't start"
- Check Logs tab in Render
- Look for missing environment variables
- Verify Dockerfile paths are correct

---

## 🎉 You're All Set!

Your AsyncFlow platform will be live at:
- **API:** `https://your-api-name.onrender.com`
- **Swagger:** `https://your-api-name.onrender.com/api/docs`
- **Health:** `https://your-api-name.onrender.com/api/v1/health`

**Total Cost: $0/month** 🎊
