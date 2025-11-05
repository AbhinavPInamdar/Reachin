

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

class ConfigService {
  private static instance: ConfigService;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private loadConfig(): AppConfig {
    return {
      port: parseInt(process.env.PORT || '8080'),
      nodeEnv: process.env.NODE_ENV || 'development',
      
      mongodbUri: process.env.MONGODB_URI || 'mongodb://root:password@localhost:27017/appdb?authSource=admin',
      elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',

      
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

  private validateConfig(): void {
    const errors: string[] = [];

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

  public get(): AppConfig {
    return { ...this.config }; 
  }

  public getPort(): number {
    return this.config.port;
  }

  public getMongoUri(): string {
    return this.config.mongodbUri;
  }

  public getElasticsearchUrl(): string {
    return this.config.elasticsearchUrl;
  }



  public getOpenAIKey(): string {
    return this.config.openaiApiKey;
  }

  public getNotificationConfig(): { slack: string; webhook: string } {
    return {
      slack: this.config.slackWebhookUrl,
      webhook: this.config.webhookSiteUrl
    };
  }

  public isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  public isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }
}

export const configService = ConfigService.getInstance();