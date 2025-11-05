# Render Deployment Guide

## Why Render?

Render is perfect for this email aggregator because:
- Supports long-running processes (IMAP connections)
- Built-in PostgreSQL/Redis databases
- No serverless limitations
- Automatic deployments from Git

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be pushed to GitHub

## Deployment Steps

### 1. Create Backend Service

1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `reachinbox-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Starter` (free tier)

### 2. Add Environment Variables

In your service settings, add:
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/reachinbox
REDIS_URL=redis://your-redis-url
GMAIL_USERNAME=your-email@gmail.com
GMAIL_PASSWORD=your-app-password
OPENAI_API_KEY=your-openai-key
WEBHOOK_SITE_URL=your-webhook-url
```

### 3. Create Database Services

**Option A: Use Render's Built-in Services**
1. Create PostgreSQL database (free tier)
2. Create Redis instance (paid)

**Option B: Use External Services**
- MongoDB Atlas (free tier)
- Redis Cloud (free tier)
- Elasticsearch Cloud

### 4. Deploy Frontend (Optional)

1. Create another Web Service for frontend
2. Configure:
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Start Command**: `cd frontend && npm start`

### 5. Update CORS Origins

After deployment, update `src/server.ts` with your actual Render URLs:
```typescript
origin: ['https://your-app-name.onrender.com']
```

## Database Setup

### MongoDB Atlas (Recommended)
```
1. Create account at https://cloud.mongodb.com
2. Create cluster (free M0 tier)
3. Create database user
4. Whitelist Render IPs: 0.0.0.0/0 (or specific IPs)
5. Get connection string
```

### Redis Cloud
```
1. Create account at https://redis.com/try-free/
2. Create database (30MB free)
3. Get connection URL and password
```

## Advantages of Render

- **Persistent Connections**: IMAP sync works perfectly
- **Background Jobs**: Email processing runs continuously
- **Auto-scaling**: Handles traffic spikes
- **Free Tier**: Good for testing and small projects
- **Easy Deployment**: Git-based deployments

## Post-Deployment

1. Check service logs for any errors
2. Test IMAP connection via `/api/imap/health`
3. Verify email sync functionality
4. Set up monitoring and alerts