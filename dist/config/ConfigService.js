"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configService = void 0;
class ConfigService {
    constructor() {
        this.config = this.loadConfig();
        this.validateConfig();
    }
    static getInstance() {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }
    loadConfig() {
        return {
            port: parseInt(process.env.PORT || '8080'),
            nodeEnv: process.env.NODE_ENV || 'development',
            mongodbUri: process.env.MONGODB_URI || 'mongodb://root:password@localhost:27017/appdb?authSource=admin',
            elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
            redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
            redisPassword: process.env.REDIS_PASSWORD || 'changeme',
            gmailUsername: process.env.GMAIL_USERNAME || '',
            gmailPassword: process.env.GMAIL_PASSWORD || '',
            outlookUsername: process.env.OUTLOOK_USERNAME || '',
            outlookPassword: process.env.OUTLOOK_PASSWORD || '',
            openaiApiKey: process.env.OPENAI_API_KEY || '',
            slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || '',
            webhookSiteUrl: process.env.WEBHOOK_SITE_URL || '',
            logLevel: process.env.LOG_LEVEL || 'info'
        };
    }
    validateConfig() {
        const errors = [];
        if (!this.config.mongodbUri) {
            errors.push('MONGODB_URI is required');
        }
        if (this.config.port < 1 || this.config.port > 65535) {
            errors.push('PORT must be between 1 and 65535');
        }
        if (errors.length > 0) {
            throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
        }
    }
    get() {
        return { ...this.config };
    }
    getPort() {
        return this.config.port;
    }
    getMongoUri() {
        return this.config.mongodbUri;
    }
    getElasticsearchUrl() {
        return this.config.elasticsearchUrl;
    }
    getRedisConfig() {
        return {
            url: this.config.redisUrl,
            password: this.config.redisPassword
        };
    }
    getOpenAIKey() {
        return this.config.openaiApiKey;
    }
    getNotificationConfig() {
        return {
            slack: this.config.slackWebhookUrl,
            webhook: this.config.webhookSiteUrl
        };
    }
    isDevelopment() {
        return this.config.nodeEnv === 'development';
    }
    isProduction() {
        return this.config.nodeEnv === 'production';
    }
}
exports.configService = ConfigService.getInstance();
//# sourceMappingURL=ConfigService.js.map