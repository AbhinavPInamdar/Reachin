import { Client } from '@elastic/elasticsearch';
import { logger } from '../utils/logger';

class ElasticsearchClient {
  private client: Client;
  private connected: boolean = false;

  constructor() {
    // Always use local Elasticsearch as per assignment requirements
    this.client = new Client({
      node: 'http://localhost:9200',
      requestTimeout: 30000,
      pingTimeout: 3000,
    });
  }

  async connect(): Promise<void> {
    try {
      const health = await this.client.cluster.health();
      logger.info('Elasticsearch connected successfully', { status: health.status });
      this.connected = true;
      
      // Create email index if it doesn't exist
      await this.createEmailIndex();
    } catch (error) {
      logger.error('Failed to connect to local Elasticsearch. Make sure Elasticsearch is running on localhost:9200', error);
      logger.info('💡 Run "docker-compose up elasticsearch" to start Elasticsearch locally');
      this.connected = false;
      // Don't throw error - allow app to continue for development
    }
  }

  async createEmailIndex(): Promise<void> {
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
        
        logger.info('Email index created successfully');
      }
    } catch (error) {
      logger.error('Failed to create email index:', error);
      throw error;
    }
  }

  async indexEmail(email: any): Promise<void> {
    if (!this.connected) {
      logger.debug('Elasticsearch not connected, skipping email indexing');
      return;
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

      logger.debug('Email indexed successfully', { messageId: email.messageId });
    } catch (error) {
      logger.error('Failed to index email:', error);
      throw error;
    }
  }

  async searchEmails(query: string, filters: any = {}): Promise<any[]> {
    if (!this.connected) {
      logger.warn('Elasticsearch not connected, returning empty search results');
      return [];
    }

    try {
      const searchBody: any = {
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

      // Add text search query
      if (query && query.trim()) {
        searchBody.query.bool.must.push({
          multi_match: {
            query: query,
            fields: ['subject^2', 'bodyText', 'from'],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        });
      } else {
        searchBody.query.bool.must.push({
          match_all: {}
        });
      }

      // Add filters
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
        const dateRange: any = {};
        if (filters.dateFrom) dateRange.gte = filters.dateFrom;
        if (filters.dateTo) dateRange.lte = filters.dateTo;
        
        searchBody.query.bool.filter.push({
          range: { receivedAt: dateRange }
        });
      }

      const response = await this.client.search({
        index: 'emails',
        body: searchBody
      });

      return response.hits.hits.map((hit: any) => ({
        _id: hit._id,
        _score: hit._score,
        ...hit._source
      }));
    } catch (error) {
      logger.error('Elasticsearch search failed:', error);
      throw error;
    }
  }

  async deleteEmail(emailId: string): Promise<void> {
    if (!this.connected) {
      logger.debug('Elasticsearch not connected, skipping email deletion from index');
      return;
    }

    try {
      await this.client.delete({
        index: 'emails',
        id: emailId
      });
      
      logger.debug('Email deleted from index', { emailId });
    } catch (error) {
      if ((error as any).meta?.statusCode !== 404) {
        logger.error('Failed to delete email from index:', error);
        throw error;
      }
    }
  }

  async getStats(): Promise<any> {
    if (!this.connected) {
      logger.warn('Elasticsearch not connected, returning empty stats');
      return {
        totalEmails: 0,
        categories: [],
        accounts: [],
        folders: []
      };
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
        totalEmails: (response.aggregations?.total_emails as any)?.value || 0,
        categories: (response.aggregations?.categories as any)?.buckets || [],
        accounts: (response.aggregations?.accounts as any)?.buckets || [],
        folders: (response.aggregations?.folders as any)?.buckets || []
      };
    } catch (error) {
      logger.error('Failed to get Elasticsearch stats:', error);
      throw error;
    }
  }

  getClient(): Client {
    return this.client;
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const elasticsearchClient = new ElasticsearchClient();