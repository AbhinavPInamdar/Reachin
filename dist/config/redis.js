"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectRedis = exports.connectRedis = exports.redisClient = void 0;
const redis_1 = require("redis");
const logger_1 = require("../utils/logger");
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || 'changeme';
const connectRedis = async () => {
    try {
        exports.redisClient = (0, redis_1.createClient)({
            url: REDIS_URL,
            password: REDIS_PASSWORD,
            socket: {
                reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
            }
        });
        exports.redisClient.on('error', (error) => {
            logger_1.logger.error('Redis connection error:', error);
        });
        exports.redisClient.on('connect', () => {
            logger_1.logger.info('📡 Connecting to Redis...');
        });
        exports.redisClient.on('ready', () => {
            logger_1.logger.info('✅ Connected to Redis successfully');
        });
        exports.redisClient.on('reconnecting', () => {
            logger_1.logger.info('🔄 Reconnecting to Redis...');
        });
        await exports.redisClient.connect();
        await exports.redisClient.ping();
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to Redis:', error);
        throw error;
    }
};
exports.connectRedis = connectRedis;
const disconnectRedis = async () => {
    try {
        if (exports.redisClient) {
            await exports.redisClient.quit();
            logger_1.logger.info('✅ Disconnected from Redis');
        }
    }
    catch (error) {
        logger_1.logger.error('Error disconnecting from Redis:', error);
        throw error;
    }
};
exports.disconnectRedis = disconnectRedis;
//# sourceMappingURL=redis.js.map