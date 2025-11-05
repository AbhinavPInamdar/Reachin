import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { elasticsearchClient } from './config/elasticsearch';
import { imapService } from './services/imapService';
import { logger } from './utils/logger';
import accountRoutes from './routes/accountRoutes';
import { errorHandler } from './middleware/errorHandler';
import { configService } from './config/ConfigService';

dotenv.config();

const app = express();
const PORT = configService.getPort();

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-render-frontend.onrender.com', 'https://your-render-app.onrender.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/accounts', accountRoutes);
app.use('/api/imap', require('./routes/imapRoutes').default);
app.use('/api', require('./routes/simpleRoutes').default);


app.get('/health', (_req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'ReachInbox Email Aggregator',
    services: {
      elasticsearch: elasticsearchClient.isConnected(),
      imap: Object.keys(imapService.getAllConnectionStatuses()).length > 0
    }
  };
  
  res.json(health);
});

app.use(errorHandler);

async function startServer() {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();
    
    // Connect to Elasticsearch
    try {
      await elasticsearchClient.connect();
      logger.info('Elasticsearch connected successfully');
    } catch (error) {
      logger.warn('Elasticsearch connection failed, using MongoDB fallback:', error);
    }

    // IMAP service available but not auto-started to prevent crashes
    logger.info('IMAP service initialized (manual start required)');

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`ReachInbox Email Aggregator started successfully`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function gracefulShutdown() {
  logger.info('Shutting down gracefully...');
  
  try {
    // Stop IMAP connections
    await imapService.stopAllConnections();
    logger.info('IMAP connections closed');
  } catch (error) {
    logger.error('Error closing IMAP connections:', error);
  }
  
  process.exit(0);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();