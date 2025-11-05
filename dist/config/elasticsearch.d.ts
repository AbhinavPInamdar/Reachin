import { Client } from '@elastic/elasticsearch';
declare class ElasticsearchClient {
    private client;
    private connected;
    constructor();
    connect(): Promise<void>;
    createEmailIndex(): Promise<void>;
    indexEmail(email: any): Promise<void>;
    searchEmails(query: string, filters?: any): Promise<any[]>;
    deleteEmail(emailId: string): Promise<void>;
    getStats(): Promise<any>;
    getClient(): Client;
    isConnected(): boolean;
}
export declare const elasticsearchClient: ElasticsearchClient;
export {};
//# sourceMappingURL=elasticsearch.d.ts.map