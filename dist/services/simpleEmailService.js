"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleEmailService = void 0;
const Email_1 = require("../models/Email");
const elasticsearch_1 = require("../config/elasticsearch");
const logger_1 = require("../utils/logger");
class SimpleEmailService {
    static async getEmails(filters = {}) {
        try {
            if (elasticsearch_1.elasticsearchClient.isConnected()) {
                const emails = await elasticsearch_1.elasticsearchClient.searchEmails('', filters);
                return emails;
            }
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
            return emails;
        }
        catch (error) {
            logger_1.logger.error('Error getting emails:', error);
            throw error;
        }
    }
    static async searchEmails(searchText, filters = {}) {
        try {
            if (elasticsearch_1.elasticsearchClient.isConnected()) {
                const emails = await elasticsearch_1.elasticsearchClient.searchEmails(searchText, filters);
                return emails;
            }
            const query = {
                $and: []
            };
            if (searchText && searchText.trim()) {
                query.$and.push({
                    $or: [
                        { subject: { $regex: searchText, $options: 'i' } },
                        { from: { $regex: searchText, $options: 'i' } },
                        { 'body.text': { $regex: searchText, $options: 'i' } }
                    ]
                });
            }
            if (filters.accountId) {
                query.$and.push({ accountId: filters.accountId });
            }
            if (filters.folder) {
                query.$and.push({ folder: filters.folder });
            }
            if (filters.category) {
                query.$and.push({ category: filters.category });
            }
            if (query.$and.length === 0) {
                delete query.$and;
            }
            const emails = await Email_1.Email.find(query)
                .sort({ receivedAt: -1 })
                .limit(filters.limit || 50);
            return emails;
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
            logger_1.logger.error('Error getting email:', error);
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
    static async indexEmailInElasticsearch(email) {
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
    static async deleteEmailFromElasticsearch(emailId) {
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
    static async getSearchStats() {
        try {
            if (elasticsearch_1.elasticsearchClient.isConnected()) {
                return await elasticsearch_1.elasticsearchClient.getStats();
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
}
exports.SimpleEmailService = SimpleEmailService;
//# sourceMappingURL=simpleEmailService.js.map