"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const Email_1 = require("../models/Email");
const elasticsearch_1 = require("../config/elasticsearch");
const logger_1 = require("../utils/logger");
class EmailService {
    static async getEmails(filters = {}) {
        try {
            if (elasticsearch_1.elasticsearchClient.isConnected()) {
                try {
                    const emails = await elasticsearch_1.elasticsearchClient.searchEmails('', filters);
                    logger_1.logger.debug('Retrieved emails from Elasticsearch', { count: emails.length });
                    return emails;
                }
                catch (esError) {
                    logger_1.logger.warn('Elasticsearch query failed, falling back to MongoDB:', esError);
                }
            }
            return await this.getEmailsFromMongoDB(filters);
        }
        catch (error) {
            logger_1.logger.error('Error getting emails:', error);
            throw error;
        }
    }
    static async searchEmails(searchText, filters = {}) {
        try {
            if (elasticsearch_1.elasticsearchClient.isConnected()) {
                try {
                    const emails = await elasticsearch_1.elasticsearchClient.searchEmails(searchText, filters);
                    logger_1.logger.debug('Search completed via Elasticsearch', {
                        query: searchText,
                        results: emails.length
                    });
                    return emails;
                }
                catch (esError) {
                    logger_1.logger.warn('Elasticsearch search failed, falling back to MongoDB:', esError);
                }
            }
            return await this.searchEmailsInMongoDB(searchText, filters);
        }
        catch (error) {
            logger_1.logger.error('Error searching emails:', error);
            throw error;
        }
    }
    static async getEmailById(id) {
        try {
            const email = await Email_1.Email.findById(id);
            return email;
        }
        catch (error) {
            logger_1.logger.error('Error getting email by ID:', error);
            throw error;
        }
    }
    static async countEmails(filters = {}) {
        try {
            const query = {};
            if (filters.accountId)
                query.accountId = filters.accountId;
            if (filters.category) {
                if (typeof filters.category === 'object' && filters.category.$exists) {
                    query.category = { $exists: true, $ne: null };
                }
                else {
                    query.category = filters.category;
                }
            }
            const count = await Email_1.Email.countDocuments(query);
            logger_1.logger.debug('Email count query result', { query, count });
            return count;
        }
        catch (error) {
            logger_1.logger.error('Error counting emails:', error);
            throw error;
        }
    }
    static async indexEmail(email) {
        try {
            if (elasticsearch_1.elasticsearchClient.isConnected()) {
                await elasticsearch_1.elasticsearchClient.indexEmail(email);
                logger_1.logger.debug('Email indexed in Elasticsearch', { messageId: email.messageId });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to index email in Elasticsearch:', error);
        }
    }
    static async deleteEmailFromIndex(emailId) {
        try {
            if (elasticsearch_1.elasticsearchClient.isConnected()) {
                await elasticsearch_1.elasticsearchClient.deleteEmail(emailId);
                logger_1.logger.debug('Email deleted from Elasticsearch', { emailId });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to delete email from Elasticsearch:', error);
        }
    }
    static async getStats() {
        try {
            if (elasticsearch_1.elasticsearchClient.isConnected()) {
                try {
                    return await elasticsearch_1.elasticsearchClient.getStats();
                }
                catch (esError) {
                    logger_1.logger.warn('Elasticsearch stats failed, falling back to MongoDB:', esError);
                }
            }
            const stats = await Email_1.Email.aggregate([
                {
                    $group: {
                        _id: null,
                        totalEmails: { $sum: 1 },
                        categories: { $push: '$category' },
                        accounts: { $push: '$accountId' },
                        folders: { $push: '$folder' }
                    }
                }
            ]);
            return stats[0] || {
                totalEmails: 0,
                categories: [],
                accounts: [],
                folders: []
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting search stats:', error);
            throw error;
        }
    }
    static async getEmailsFromMongoDB(filters) {
        const query = {};
        if (filters.accountId)
            query.accountId = filters.accountId;
        if (filters.folder)
            query.folder = filters.folder;
        if (filters.category)
            query.category = filters.category;
        const emails = await Email_1.Email.find(query)
            .sort({ receivedAt: -1 })
            .limit(filters.limit || 50);
        logger_1.logger.debug('Retrieved emails from MongoDB', { count: emails.length });
        return emails;
    }
    static async searchEmailsInMongoDB(searchText, filters) {
        const query = { $and: [] };
        if (searchText && searchText.trim()) {
            query.$and.push({
                $or: [
                    { subject: { $regex: searchText, $options: 'i' } },
                    { from: { $regex: searchText, $options: 'i' } },
                    { 'body.text': { $regex: searchText, $options: 'i' } }
                ]
            });
        }
        if (filters.accountId)
            query.$and.push({ accountId: filters.accountId });
        if (filters.folder)
            query.$and.push({ folder: filters.folder });
        if (filters.category)
            query.$and.push({ category: filters.category });
        if (query.$and.length === 0) {
            delete query.$and;
        }
        const emails = await Email_1.Email.find(query)
            .sort({ receivedAt: -1 })
            .limit(filters.limit || 50);
        logger_1.logger.debug('Search completed via MongoDB', {
            query: searchText,
            results: emails.length
        });
        return emails;
    }
}
exports.EmailService = EmailService;
//# sourceMappingURL=EmailService.js.map