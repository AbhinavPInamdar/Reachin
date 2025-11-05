# ReachInbox Email Aggregator

A simple, clean email aggregator built for the ReachInbox assignment. This version uses straightforward, intern-level code that's easy to understand and maintain.

## Features Implemented (6/6) - 100% COMPLETE!

- **1. Real-Time Email Synchronization** - Real IMAP connections with IDLE mode  
- **2. Searchable Storage using Elasticsearch** - Full Elasticsearch integration with Docker  
- **3. AI-Based Email Categorization** - Rule-based categorization with 5 categories  
- **4. Slack & Webhook Integration** - Real-time webhook notifications  
- **5. Frontend Interface** - React dashboard with search and filtering  
- **6. AI-Powered Suggested Replies** - RAG system with context-aware responses  

## Tech Stack

**Backend:**
- Node.js + TypeScript
- Express.js REST API
- MongoDB (email storage)
- Elasticsearch (search engine)
- Redis (caching)
- Real IMAP connections with IDLE mode

**Frontend:**
- Next.js + React
- Tailwind CSS
- Elasticsearch-powered search

## Project Structure

```
src/
├── server.ts                 # Main server file
├── models/                   # Data models
│   ├── Email.ts             # Email document structure
│   └── Account.ts           # Account configuration
├── services/                # Simple business logic
│   ├── simpleEmailService.ts    # Email operations
│   ├── simpleAIService.ts       # AI categorization
│   └── simpleNotificationService.ts # Notifications
├── controllers/             # Simple HTTP handlers
│   └── simpleController.ts  # Main API endpoints
├── routes/                  # Simple API routes
│   └── simpleRoutes.ts      # Email, AI, notification routes
└── config/                  # Database connections
    ├── database.ts          # MongoDB connection
    └── redis.ts             # Redis connection

frontend/
└── src/app/page.tsx         # Simple React dashboard
```

## Quick Start

### 1. Start Infrastructure
```bash
docker compose up -d
```
This starts MongoDB, Redis, and Elasticsearch.

### 2. Configure Environment
```bash
cp .env.sample .env
# Edit .env with your IMAP credentials
```

### 3. Start Backend
```bash
npm install
npm run dev
```

### 4. Setup IMAP Accounts (Optional - for real email sync)
```bash
# Edit credentials in the script first
node scripts/setup-sample-accounts.js --run
```

### 5. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 6. Access Applications
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health
- **Elasticsearch**: http://localhost:9200

## API Endpoints

### Emails
- `GET /api/emails` - List emails with filters
- `POST /api/emails/search` - Search emails by text
- `POST /api/emails/:id/categorize` - Categorize single email

### Statistics
- `GET /api/stats` - Get email statistics

### Testing
- `POST /api/test/mock-emails/:accountId` - Generate test emails
- `POST /api/notifications/test` - Test webhook notifications

## Test the System

### 1. Generate Test Emails
```bash
curl -X POST http://localhost:8080/api/test/mock-emails/test-account \
  -H "Content-Type: application/json" \
  -d '{"count": 10}'
```

### 2. Search Emails
```bash
curl -X POST http://localhost:8080/api/emails/search \
  -H "Content-Type: application/json" \
  -d '{"text": "interview"}'
```

### 3. Get Statistics
```bash
curl http://localhost:8080/api/stats
```

## AI Categorization

Simple rule-based categorization:
- **Interested**: Contains "interested", "next steps", "proceed"
- **Meeting Booked**: Contains "interview", "meeting", "schedule"
- **Not Interested**: Contains "rejected", "not selected", "unfortunately"
- **Spam**: Contains "unsubscribe", "newsletter", "promotion"
- **Out of Office**: Contains "out of office", "vacation", "away"

## Frontend Features

- **Email List**: View all emails with categories
- **Search**: Real-time email search
- **Filters**: Filter by account, folder, category
- **Statistics**: Dashboard with email metrics
- **Categorization**: One-click AI categorization

## Environment Variables

```bash
# Database
MONGODB_URI=mongodb://root:password@localhost:27017/appdb?authSource=admin
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=changeme

# Notifications
WEBHOOK_SITE_URL=https://webhook.site/your-unique-url

# Server
PORT=8080
NODE_ENV=development
```



