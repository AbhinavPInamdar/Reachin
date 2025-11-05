# Vercel Deployment Guide

## Prerequisites

1. **Cloud Database Services** (Required for Vercel):
   - MongoDB Atlas (free tier available)
   - Elasticsearch Cloud or similar
   - Redis Cloud or Upstash Redis

2. **Environment Variables**:
   - Copy `.env.example` to configure your environment variables in Vercel dashboard

## Deployment Steps

### 1. Prepare Cloud Services

**MongoDB Atlas:**
```
1. Create account at https://cloud.mongodb.com
2. Create a cluster
3. Get connection string: mongodb+srv://username:password@cluster.mongodb.net/database
```

**Redis Cloud:**
```
1. Create account at https://redis.com/try-free/
2. Create database
3. Get connection URL and password
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 3. Configure Environment Variables

In Vercel Dashboard:
1. Go to your project settings
2. Add environment variables from `.env.example`
3. Redeploy

## Important Notes

- **IMAP Limitations**: Vercel serverless functions have execution time limits. IMAP sync might need to be moved to a background service.
- **Database**: Local MongoDB/Redis won't work on Vercel. Use cloud services.
- **File Storage**: Logs and temporary files should use cloud storage.

## Alternative: Railway/Render

For full backend functionality, consider:
- Railway.app (supports long-running processes)
- Render.com (supports background services)
- DigitalOcean App Platform