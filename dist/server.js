"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const elasticsearch_1 = require("./config/elasticsearch");
const imapService_1 = require("./services/imapService");
const logger_1 = require("./utils/logger");
const accountRoutes_1 = __importDefault(require("./routes/accountRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
const ConfigService_1 = require("./config/ConfigService");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = ConfigService_1.configService.getPort();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['https://your-render-frontend.onrender.com', 'https://your-render-app.onrender.com']
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/accounts', accountRoutes_1.default);
app.use('/api/imap', require('./routes/imapRoutes').default);
app.use('/api', require('./routes/simpleRoutes').default);
app.get('/health', (_req, res) => {
    const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'ReachInbox Email Aggregator',
        services: {
            elasticsearch: elasticsearch_1.elasticsearchClient.isConnected(),
            imap: Object.keys(imapService_1.imapService.getAllConnectionStatuses()).length > 0
        }
    };
    res.json(health);
});
app.use(errorHandler_1.errorHandler);
async function startServer() {
    try {
        await (0, database_1.connectDatabase)();
        try {
            await elasticsearch_1.elasticsearchClient.connect();
            logger_1.logger.info('Elasticsearch connected successfully');
        }
        catch (error) {
            logger_1.logger.warn('Elasticsearch connection failed, using MongoDB fallback:', error);
        }
        logger_1.logger.info('IMAP service initialized (manual start required)');
        app.listen(PORT, () => {
            logger_1.logger.info(`Server running on port ${PORT}`);
            logger_1.logger.info(`ReachInbox Email Aggregator started successfully`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
async function gracefulShutdown() {
    logger_1.logger.info('Shutting down gracefully...');
    try {
        await imapService_1.imapService.stopAllConnections();
        logger_1.logger.info('IMAP connections closed');
    }
    catch (error) {
        logger_1.logger.error('Error closing IMAP connections:', error);
    }
    process.exit(0);
}
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
startServer();
//# sourceMappingURL=server.js.map