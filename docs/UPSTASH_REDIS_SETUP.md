# Setting Up Upstash Redis (FREE) for AsyncFlow

## Why Upstash?

Since Render removed their free Redis tier, **Upstash** is the best free alternative:

✅ **10,000 commands/day** FREE  
✅ **256 MB storage**  
✅ **No credit card required**  
✅ **Global edge locations**  
✅ **TLS encryption included**  
✅ **Perfect for AsyncFlow**  

## Step-by-Step Setup

### 1. Create Upstash Account

1. Go to https://upstash.com
2. Click **"Get Started"**
3. Sign up with:
   - GitHub (recommended - instant signup)
   - Google
   - Email

### 2. Create Redis Database

1. After login, click **"Create Database"**

2. **Configure your database:**
   ```
   Name: asyncflow-redis
   Type: Regional (select this)
   Region: Choose closest to your location
            - US East (Virginia) if Render is in Oregon
            - Europe (Ireland) if Render is in Frankfurt
   
   Primary Region: Same as above
   Read Regions: None needed for free tier
   
   Eviction: Enable (recommended)
   TLS: Enable (default, keep it)
   ```

3. Click **"Create"**

### 3. Get Connection Details

After creation, you'll see your database dashboard:

#### Copy These Values:

**REST API Section:**
```bash
UPSTASH_REDIS_REST_URL=https://perfect-unicorn-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXaBcdEfGh...
```

**Connection Details (scroll down):**
```bash
Endpoint: perfect-unicorn-12345.upstash.io
Port: 6379
Password: AYabcdefgh...long-password-here
```

### 4. Use in AsyncFlow

For Render deployment, add these environment variables:

```bash
# Redis Configuration (Upstash)
REDIS_HOST=perfect-unicorn-12345.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-upstash-password-here
REDIS_TLS=true
```

**Important:** Replace with YOUR actual values from Upstash!

### 5. Update AsyncFlow Code (If Needed)

Our AsyncFlow code already supports TLS Redis. If you face connection issues, verify the Redis connection string format.

**Connection string format:**
```
rediss://default:password@host:6379
```
(Note: `rediss://` with double 's' for TLS)

## Testing Connection

### From Render Shell

1. Go to your Render API service
2. Click **"Shell"** tab
3. Test connection:

```bash
# Using node
node -e "const Redis = require('ioredis'); const redis = new Redis({ host: 'your-host.upstash.io', port: 6379, password: 'your-password', tls: {} }); redis.ping().then(console.log);"
```

Expected output: `PONG`

## Upstash Dashboard Features

### Monitor Usage

1. Go to https://console.upstash.com
2. Click on your database
3. View:
   - **Daily Commands** - Track your 10k/day limit
   - **Data Size** - Monitor storage usage
   - **Latency** - Check performance

### Data Browser

- Click **"Data Browser"** tab
- View your Redis keys
- See BullMQ job data
- Debug queue issues

### Metrics

- **Commands/sec** - Real-time throughput
- **Connected Clients** - Active connections
- **Memory Usage** - Storage utilization

## Free Tier Limits

| Feature | Limit | What Happens |
|---------|-------|--------------|
| Commands/Day | 10,000 | Throttled after limit |
| Storage | 256 MB | Eviction (LRU) |
| Connections | 100 | Connection refused after |
| Regions | 1 | Can't use multi-region |
| Bandwidth | 200 MB/day | Throttled after limit |

### What Uses Commands?

Each operation = 1 command:
- `SET` = 1 command
- `GET` = 1 command
- `HSET` = 1 command
- BullMQ adds job = ~5-10 commands

**Estimate for AsyncFlow:**
- Create job: ~10 commands
- Process job: ~15 commands
- Total: ~25 commands per job

**Daily capacity:** ~400 jobs/day on free tier

## Upgrade Options

If you need more:

### Pay As You Go ($0.2 per 100K commands)
- $0.20 per 100,000 commands
- $0.25 per GB storage
- No monthly minimums

### Pro ($120/month)
- 10M commands/day included
- 10 GB storage
- Priority support

## Common Issues

### Connection Timeout

**Problem:** Can't connect to Redis

**Solution:**
```bash
# Verify TLS is enabled
REDIS_TLS=true

# Check host is correct (no http://)
REDIS_HOST=xxx.upstash.io  # ✅ Correct
REDIS_HOST=https://xxx.upstash.io  # ❌ Wrong
```

### Authentication Failed

**Problem:** WRONGPASS error

**Solution:**
- Double-check password from Upstash dashboard
- Ensure no extra spaces in password
- Password should be very long (~100 characters)

### Rate Limited

**Problem:** "ERR rate limit exceeded"

**Solution:**
- You've hit 10,000 commands/day
- Wait for daily reset (midnight UTC)
- Or upgrade to paid tier

## Alternative Free Redis Services

If Upstash doesn't work for you:

### 1. Redis Cloud (30MB FREE)
- https://redis.com/try-free/
- 30 MB storage
- 30 connections
- No daily command limit

### 2. Aiven (1 GB FREE)
- https://aiven.io/free-redis
- 1 GB storage
- Limited to 1 service
- Good performance

### 3. Railway ($5 credit)
- https://railway.app
- Includes Redis
- $5 credit = ~500 hours/month
- Better than free but requires credit card

## Recommendation for AsyncFlow

**For Development/Portfolio:**
→ Use **Upstash Free** (10k commands/day is enough)

**For Production:**
→ Upgrade Upstash to Pay-As-You-Go (~$2-5/month for light usage)

**For Heavy Usage:**
→ Use Redis Cloud or managed Redis (~$10/month)

## Summary

1. ✅ Create Upstash account (free, no credit card)
2. ✅ Create Redis database (256MB, 10k commands/day)
3. ✅ Copy connection details (host, port, password)
4. ✅ Add to Render environment variables
5. ✅ Set `REDIS_TLS=true`
6. ✅ Deploy and test!

**Your AsyncFlow will work perfectly with Upstash free tier!** 🚀
