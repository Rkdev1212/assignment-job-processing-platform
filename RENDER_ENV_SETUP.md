# Complete Environment Variables for Render Deployment

## 🔍 Step 1: Get Your Upstash Redis Password

You have the REST API credentials, but you need the **Redis password** for direct Redis connection.

### Get Redis Password:

1. Go to https://console.upstash.io
2. Click on your database: **grown-chimp-86744**
3. Scroll down to **"Redis Connect"** section
4. Look for connection options:
   - **Node.js** tab or
   - **Connection Details** section
5. Copy the **Password** (starts with `AX` or `AY`, very long ~100 chars)

OR use this connection string format and extract the password:
```
redis://default:YOUR_PASSWORD_HERE@grown-chimp-86744.upstash.io:6379
```

## 📋 Complete Environment Variables

### For API Service (Render):

```bash
# Application
NODE_ENV=production
PORT=3000
API_PREFIX=api/v1

# Database (use INTERNAL URL for Render services)
DATABASE_URL=postgresql://job_processing_platform_user:AAYPBGUUbE1qrpQRaI17emkNHRciA2F1@dpg-d9mpmodaeets73agosf0-a/job_processing_platform

# Redis (Upstash)
REDIS_HOST=grown-chimp-86744.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_ACTUAL_REDIS_PASSWORD_FROM_UPSTASH
REDIS_TLS=true
REDIS_DB=0

# Queue
QUEUE_NAME=asyncflow-jobs
QUEUE_CONCURRENCY=3
QUEUE_MAX_ATTEMPTS=3

# JWT Authentication (generate secure random string)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRATION=24h

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
LOG_PRETTY=false

# Metrics
METRICS_ENABLED=true

# Retry Strategy
RETRY_STRATEGY=exponential
RETRY_BASE_DELAY=1000
RETRY_MAX_DELAY=60000
RETRY_MULTIPLIER=2
```

### For Worker Service (Render):

**Same as API, plus these Worker-specific variables:**

```bash
# Worker Configuration
WORKER_ID=worker-render-1
WORKER_HEARTBEAT_INTERVAL=30000
WORKER_GRACEFUL_SHUTDOWN_TIMEOUT=30000
```

## 🔐 Generate JWT Secret

Run this in PowerShell to generate a secure JWT secret:

```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

Copy the output and use it for `JWT_SECRET`.

## 📝 How to Add in Render

### For API Service:

1. Go to Render Dashboard
2. Click on your **API service**
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Add each variable one by one (or use "Add from .env")
6. Save Changes (service will redeploy automatically)

### For Worker Service:

1. Go to Render Dashboard
2. Click on your **Worker service**
3. Go to **Environment** tab
4. Add the SAME variables as API
5. Plus add Worker-specific variables
6. Save Changes

## ✅ Verification Checklist

Before deploying, verify you have:

- [ ] ✅ DATABASE_URL (internal Render PostgreSQL URL)
- [ ] ✅ REDIS_HOST (grown-chimp-86744.upstash.io)
- [ ] ✅ REDIS_PORT (6379)
- [ ] ✅ REDIS_PASSWORD (actual password from Upstash, NOT REST token)
- [ ] ✅ REDIS_TLS (set to `true`)
- [ ] ✅ JWT_SECRET (secure random string)
- [ ] ✅ NODE_ENV (set to `production`)

## 🚨 Common Mistakes

### ❌ Using External Database URL
```
# DON'T USE (external):
postgresql://...@dpg-xxx.oregon-postgres.render.com/...

# USE (internal):
postgresql://...@dpg-xxx/...
```

### ❌ Using REST Token as Redis Password
```
# DON'T USE:
REDIS_PASSWORD=gQAAAAAAAVLYAAIgcDExMTQ3ZDMwMGMzZTk0ZmE5YTEyNTMxYmRlYjQ0ODYxMw

# USE (get from Upstash Dashboard):
REDIS_PASSWORD=AYabcdefgh...100-char-long-password
```

### ❌ Missing REDIS_TLS
```
# DON'T FORGET:
REDIS_TLS=true
```

## 🧪 Test Connection Locally (Optional)

If you want to test from your local machine:

```bash
# Use EXTERNAL database URL for local testing
DATABASE_URL=postgresql://job_processing_platform_user:AAYPBGUUbE1qrpQRaI17emkNHRciA2F1@dpg-d9mpmodaeets73agosf0-a.oregon-postgres.render.com/job_processing_platform

# Upstash works from anywhere
REDIS_HOST=grown-chimp-86744.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_TLS=true
```

## 📊 Quick Reference

| Variable | API Service | Worker Service | Value |
|----------|-------------|----------------|-------|
| DATABASE_URL | ✅ | ✅ | Internal Render URL |
| REDIS_HOST | ✅ | ✅ | grown-chimp-86744.upstash.io |
| REDIS_PORT | ✅ | ✅ | 6379 |
| REDIS_PASSWORD | ✅ | ✅ | From Upstash Dashboard |
| REDIS_TLS | ✅ | ✅ | true |
| JWT_SECRET | ✅ | ✅ | Random 64+ chars |
| WORKER_ID | ❌ | ✅ | worker-render-1 |

## 🎯 Next Steps

1. Get Redis password from Upstash Dashboard
2. Generate JWT secret
3. Add all variables to Render API service
4. Add all variables to Render Worker service
5. Services will auto-redeploy
6. Check logs for any errors
7. Test API at: `https://your-api-name.onrender.com/api/v1/health`

---

**Need help?** Check the logs in Render Dashboard → Your Service → Logs tab
