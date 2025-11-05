export interface AppConfig {
    port: number;
    nodeEnv: string;
    mongodbUri: string;
    elasticsearchUrl: string;
    gmailUsername: string;
    gmailPassword: string;
    outlookUsername: string;
    outlookPassword: string;
    openaiApiKey: string;
    slackWebhookUrl: string;
    webhookSiteUrl: string;
    logLevel: string;
}
declare class ConfigService {
    private static instance;
    private config;
    private constructor();
    static getInstance(): ConfigService;
    private loadConfig;
    private validateConfig;
    get(): AppConfig;
    getPort(): number;
    getMongoUri(): string;
    getElasticsearchUrl(): string;
    getOpenAIKey(): string;
    getNotificationConfig(): {
        slack: string;
        webhook: string;
    };
    isDevelopment(): boolean;
    isProduction(): boolean;
}
export declare const configService: ConfigService;
export {};
//# sourceMappingURL=ConfigService.d.ts.map