"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elasticsearchClient = void 0;
const elasticsearch_1 = require("@elastic/elasticsearch");
const logger_1 = require("../utils/logger");
class ElasticsearchClient {
    constructor() {
        this.connected = false;
        this.client = new elasticsearch_1.Client({
            node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
            requestTimeout: 30000,
            pingTimeout: 3000,
        });
    }
    async connect() {
        try {
            const health = await this.client.cluster.health();
            logger_1.logger.info('Elasticsearch connected successfully', { status: health.status });
            this.connected = true;
            await this.createEmailIndex();
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to Elasticsearch:', error);
            throw error;
        }
    }
    async createEmailIndex() {
        const indexName = 'emails';
        try {
            const exists = await this.client.indices.exists({ index: indexName });
            if (!exists) {
                await this.client.indices.create({
                    index: indexName,
                    body: {
                        mappings: {
                            properties: {
                                messageId: { type: 'keyword' },
                                accountId: { type: 'keyword' },
                                threadId: { type: 'keyword' },
                                from: {
                                    type: 'text',
                                    fields: {
                                        keyword: { type: 'keyword' }
                                    }
                                },
                                to: { type: 'keyword' },
                                cc: { type: 'keyword' },
                                bcc: { type: 'keyword' },
                                subject: {
                                    type: 'text',
                                    analyzer: 'standard'
                                },
                                bodyText: {
                                    type: 'text',
                                    analyzer: 'standard'
                                },
                                bodyHtml: { type: 'text' },
                                receivedAt: { type: 'date' },
                                folder: { type: 'keyword' },
                                tags: { type: 'keyword' },
                                category: { type: 'keyword' },
                                categoryConfidence: { type: 'float' },
                                size: { type: 'integer' },
                                attachments: {
                                    type: 'nested',
                                    properties: {
                                        filename: { type: 'keyword' },
                                        contentType: { type: 'keyword' },
                                        size: { type: 'integer' }
                                    }
                                }
                            }
                        },
                        settings: {
                            number_of_shards: 1,
                            number_of_replicas: 0,
                            analysis: {
                                analyzer: {
                                    email_analyzer: {
                                        type: 'custom',
                                        tokenizer: 'standard',
                                        filter: ['lowercase', 'stop']
                                    }
                                }
                            }
                        }
                    }
                });
                logger_1.logger.info('Email index created successfully');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to create email index:', error);
            throw error;
        }
    }
    async indexEmail(email) {
        if (!this.connected) {
            throw new Error('Elasticsearch not connected');
        }
        try {
            const document = {
                messageId: email.messageId,
                accountId: email.accountId,
                threadId: email.threadId,
                from: email.from,
                to: email.to,
                cc: email.cc,
                bcc: email.bcc,
                subject: email.subject,
                bodyText: email.body?.text,
                bodyHtml: email.body?.html,
                receivedAt: email.receivedAt,
                folder: email.folder,
                tags: email.tags,
                category: email.category,
                categoryConfidence: email.categoryConfidence,
                size: email.size,
                attachments: email.attachments
            };
            await this.client.index({
                index: 'emails',
                id: email._id?.toString() || email.messageId,
                body: document
            });
            logger_1.logger.debug('Email indexed successfully', { messageId: email.messageId });
        }
        catch (error) {
            logger_1.logger.error('Failed to index email:', error);
            throw error;
        }
    }
    async searchEmails(query, filters = {}) {
        if (!this.connected) {
            throw new Error('Elasticsearch not connected');
        }
        try {
            const searchBody = {
                query: {
                    bool: {
                        must: [],
                        filter: []
                    }
                },
                sort: [
                    { receivedAt: { order: 'desc' } }
                ],
                size: filters.limit || 50,
                from: filters.offset || 0
            };
            if (query && query.trim()) {
                searchBody.query.bool.must.push({
                    multi_match: {
                        query: query,
                        fields: ['subject^2', 'bodyText', 'from'],
                        type: 'best_fields',
                        fuzziness: 'AUTO'
                    }
                });
            }
            else {
                searchBody.query.bool.must.push({
                    match_all: {}
                });
            }
            if (filters.accountId) {
                searchBody.query.bool.filter.push({
                    term: { accountId: filters.accountId }
                });
            }
            if (filters.folder) {
                searchBody.query.bool.filter.push({
                    term: { folder: filters.folder }
                });
            }
            if (filters.category) {
                searchBody.query.bool.filter.push({
                    term: { category: filters.category }
                });
            }
            if (filters.dateFrom || filters.dateTo) {
                const dateRange = {};
                if (filters.dateFrom)
                    dateRange.gte = filters.dateFrom;
                if (filters.dateTo)
                    dateRange.lte = filters.dateTo;
                searchBody.query.bool.filter.push({
                    range: { receivedAt: dateRange }
                });
            }
            const response = await this.client.search({
                index: 'emails',
                body: searchBody
            });
            return response.hits.hits.map((hit) => ({
                _id: hit._id,
                _score: hit._score,
                ...hit._source
            }));
        }
        catch (error) {
            logger_1.logger.error('Elasticsearch search failed:', error);
            throw error;
        }
    }
    async deleteEmail(emailId) {
        if (!this.connected) {
            throw new Error('Elasticsearch not connected');
        }
        try {
            await this.client.delete({
                index: 'emails',
                id: emailId
            });
            logger_1.logger.debug('Email deleted from index', { emailId });
        }
        catch (error) {
            if (error.meta?.statusCode !== 404) {
                logger_1.logger.error('Failed to delete email from index:', error);
                throw error;
            }
        }
    }
    async getStats() {
        if (!this.connected) {
            throw new Error('Elasticsearch not connected');
        }
        try {
            const response = await this.client.search({
                index: 'emails',
                body: {
                    size: 0,
                    aggs: {
                        total_emails: {
                            value_count: { field: 'messageId' }
                        },
                        categories: {
                            terms: { field: 'category', size: 10 }
                        },
                        accounts: {
                            terms: { field: 'accountId', size: 10 }
                        },
                        folders: {
                            terms: { field: 'folder', size: 10 }
                        }
                    }
                }
            });
            return {
                totalEmails: response.aggregations?.total_emails?.value || 0,
                categories: response.aggregations?.categories?.buckets || [],
                accounts: response.aggregations?.accounts?.buckets || [],
                folders: response.aggregations?.folders?.buckets || []
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get Elasticsearch stats:', error);
            throw error;
        }
    }
    getClient() {
        return this.client;
    }
    isConnected() {
        return this.connected;
    }
}
exports.elasticsearchClient = new ElasticsearchClient();
//# sourceMappingURL=elasticsearch.js.map