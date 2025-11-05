import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { Email, IEmail, DeliveryStatus } from '../models/Email';
import { Account, IAccount } from '../models/Account';
import { EmailService } from './EmailService';
import { SimpleAIService } from './simpleAIService';
import { SimpleNotificationService } from './simpleNotificationService';

interface ImapConnection {
  imap: Imap;
  account: IAccount;
  connected: boolean;
  lastSync: Date;
}

export class ImapService extends EventEmitter {
  private connections: Map<string, ImapConnection> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5 seconds

  constructor() {
    super();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.on('newEmail', async (email: IEmail, accountId: string) => {
      try {
        // Categorize email with AI using subject and body
        const categorization = SimpleAIService.categorizeByContent(email.subject || '', email.body?.text || '');
        
        // Update email with category
        await Email.findByIdAndUpdate(email._id, {
          category: categorization.category,
          categoryConfidence: categorization.confidence
        });

        // Index in Elasticsearch
        const updatedEmail = await Email.findById(email._id);
        if (updatedEmail) {
          await EmailService.indexEmail(updatedEmail);
        }

        // Send notification if interested
        if (categorization.category === 'Interested') {
          const notificationMessage = `New interested email from ${email.from}: ${email.subject || 'No Subject'}`;
          await SimpleNotificationService.sendNotification(notificationMessage);
        }

        logger.info('New email processed', {
          accountId,
          messageId: email.messageId,
          category: categorization.category
        });
      } catch (error) {
        logger.error('Failed to process new email:', error);
      }
    });
  }

  async addAccount(account: IAccount): Promise<void> {
    try {
      if (!account.imapConfig) {
        throw new Error('IMAP configuration is required');
      }

      const imap = new Imap({
        user: account.imapConfig.username,
        password: account.imapConfig.password,
        host: account.imapConfig.host,
        port: account.imapConfig.port,
        tls: account.imapConfig.secure,
        tlsOptions: { rejectUnauthorized: false },
        keepalive: true
      });

      const connection: ImapConnection = {
        imap,
        account,
        connected: false,
        lastSync: new Date()
      };

      this.connections.set(account.accountId, connection);
      await this.connectAccount(account.accountId);
      
      logger.info('IMAP account added successfully', { accountId: account.accountId });
    } catch (error) {
      logger.error('Failed to add IMAP account:', error);
      throw error;
    }
  }

  async removeAccount(accountId: string): Promise<void> {
    const connection = this.connections.get(accountId);
    if (connection) {
      if (connection.connected) {
        connection.imap.end();
      }
      this.connections.delete(accountId);
      this.reconnectAttempts.delete(accountId);
      logger.info('IMAP account removed', { accountId });
    }
  }

  private async connectAccount(accountId: string): Promise<void> {
    const connection = this.connections.get(accountId);
    if (!connection) {
      throw new Error(`Account ${accountId} not found`);
    }

    return new Promise((resolve, reject) => {
      const { imap, account } = connection;

      imap.once('ready', async () => {
        try {
          connection.connected = true;
          this.reconnectAttempts.set(accountId, 0);
          
          logger.info('IMAP connection established', { accountId });
          
          // Sync emails for all folders
          await this.syncAllFolders(accountId);
          
          // Start IDLE monitoring for real-time updates
          await this.startIdleMonitoring(accountId);
          
          resolve();
        } catch (error) {
          logger.error('Failed to setup IMAP connection:', error);
          reject(error);
        }
      });

      imap.once('error', (error: Error) => {
        connection.connected = false;
        logger.error('IMAP connection error:', { accountId, error: error.message });
        this.handleConnectionError(accountId, error);
        reject(error);
      });

      imap.once('end', () => {
        connection.connected = false;
        logger.info('IMAP connection ended', { accountId });
        this.scheduleReconnect(accountId);
      });

      try {
        imap.connect();
      } catch (error) {
        reject(error);
      }
    });
  }

  private async syncAllFolders(accountId: string): Promise<void> {
    const connection = this.connections.get(accountId);
    if (!connection || !connection.connected) {
      throw new Error(`Account ${accountId} not connected`);
    }

    const { imap, account } = connection;
    const folders = account.folders || ['INBOX'];

    for (const folder of folders) {
      try {
        await this.syncFolder(accountId, folder);
      } catch (error) {
        logger.error('Failed to sync folder:', { accountId, folder, error });
      }
    }
  }

  private async syncFolder(accountId: string, folderName: string): Promise<void> {
    const connection = this.connections.get(accountId);
    if (!connection || !connection.connected) {
      return;
    }

    const { imap } = connection;

    return new Promise((resolve, reject) => {
      imap.openBox(folderName, true, async (error: any, box: any) => {
        if (error) {
          logger.error('Failed to open folder:', { accountId, folderName, error });
          reject(error);
          return;
        }

        try {
          // Get emails from last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const searchCriteria = ['ALL', ['SINCE', thirtyDaysAgo]];
          
          imap.search(searchCriteria, async (searchError: any, uids: any) => {
            if (searchError) {
              logger.error('IMAP search failed:', { accountId, folderName, searchError });
              reject(searchError);
              return;
            }

            if (!uids || uids.length === 0) {
              logger.info('No emails found in folder', { accountId, folderName });
              resolve();
              return;
            }

            logger.info('Found emails to sync', { accountId, folderName, count: uids.length });

            // Process emails in batches to avoid overwhelming the system
            const batchSize = 10;
            for (let i = 0; i < uids.length; i += batchSize) {
              const batch = uids.slice(i, i + batchSize);
              await this.processBatch(accountId, folderName, batch);
            }

            resolve();
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private async processBatch(accountId: string, folderName: string, uids: number[]): Promise<void> {
    const connection = this.connections.get(accountId);
    if (!connection || !connection.connected) {
      return;
    }

    const { imap } = connection;

    return new Promise((resolve, reject) => {
      const fetch = imap.fetch(uids, {
        bodies: '',
        struct: true,
        envelope: true
      });

      const emails: any[] = [];

      fetch.on('message', (msg: any, seqno: any) => {
        let buffer = '';
        let attributes: any = null;

        msg.on('body', (stream: any) => {
          stream.on('data', (chunk: any) => {
            buffer += chunk.toString('utf8');
          });
        });

        msg.once('attributes', (attrs: any) => {
          attributes = attrs;
        });

        msg.once('end', async () => {
          try {
            const parsed = await simpleParser(buffer);
            
            const emailData = {
              messageId: parsed.messageId || `${accountId}-${seqno}-${Date.now()}`,
              accountId,
              threadId: parsed.references?.[0] || parsed.inReplyTo,
              from: (parsed.from as any)?.text || '',
              to: (parsed.to as any)?.text ? [(parsed.to as any).text] : [],
              cc: (parsed.cc as any)?.text ? [(parsed.cc as any).text] : [],
              bcc: (parsed.bcc as any)?.text ? [(parsed.bcc as any).text] : [],
              subject: parsed.subject,
              body: {
                text: parsed.text || '',
                html: parsed.html || ''
              },
              attachments: parsed.attachments?.map((att: any) => ({
                filename: att.filename || 'unknown',
                contentType: att.contentType,
                size: att.size || 0
              })) || [],
              receivedAt: parsed.date || new Date(),
              size: buffer.length,
              folder: folderName,
              status: DeliveryStatus.RECEIVED,
              headers: new Map(Object.entries(parsed.headers || {}))
            };

            emails.push(emailData);
          } catch (parseError) {
            logger.error('Failed to parse email:', { accountId, seqno, parseError });
          }
        });
      });

      fetch.once('error', (fetchError: any) => {
        logger.error('IMAP fetch error:', { accountId, folderName, fetchError });
        reject(fetchError);
      });

      fetch.once('end', async () => {
        try {
          // Save emails to database
          for (const emailData of emails) {
            await this.saveEmail(emailData);
          }
          
          logger.info('Batch processed successfully', { 
            accountId, 
            folderName, 
            count: emails.length 
          });
          
          resolve();
        } catch (error) {
          logger.error('Failed to save email batch:', error);
          reject(error);
        }
      });
    });
  }

  private async saveEmail(emailData: any): Promise<void> {
    try {
      // Check if email already exists for this account
      const existingEmail = await Email.findOne({
        messageId: emailData.messageId,
        accountId: emailData.accountId
      });

      if (existingEmail) {
        logger.debug('Email already exists, skipping', { messageId: emailData.messageId });
        return;
      }

      // Additional check: prevent duplicates across accounts with same email address
      const duplicateAcrossAccounts = await Email.findOne({
        messageId: emailData.messageId
      });

      if (duplicateAcrossAccounts) {
        logger.debug('Email already exists in another account, skipping', { 
          messageId: emailData.messageId,
          existingAccount: duplicateAcrossAccounts.accountId,
          newAccount: emailData.accountId
        });
        return;
      }

      // Create new email
      const email = new Email(emailData);
      await email.save();

      // Emit event for processing
      this.emit('newEmail', email, emailData.accountId);
      
      logger.debug('Email saved successfully', { messageId: emailData.messageId });
    } catch (error) {
      logger.error('Failed to save email:', error);
      throw error;
    }
  }

  private async startIdleMonitoring(accountId: string): Promise<void> {
    const connection = this.connections.get(accountId);
    if (!connection || !connection.connected) {
      return;
    }

    const { imap } = connection;

    try {
      // Open INBOX for IDLE monitoring
      imap.openBox('INBOX', false, (error: any, box: any) => {
        if (error) {
          logger.error('Failed to open INBOX for IDLE:', { accountId, error });
          return;
        }

        // Start IDLE mode
        imap.on('mail', async (numNewMsgs: number) => {
          logger.info('New mail detected via IDLE', { accountId, numNewMsgs });
          
          try {
            // Sync the INBOX folder to get new emails
            await this.syncFolder(accountId, 'INBOX');
          } catch (syncError) {
            logger.error('Failed to sync new emails:', { accountId, syncError });
          }
        });

        // Start IDLE
        imap.on('ready', () => {
          if (imap.state === 'authenticated') {
            logger.info('Starting IDLE monitoring', { accountId });
          }
        });
      });
    } catch (error) {
      logger.error('Failed to start IDLE monitoring:', { accountId, error });
    }
  }

  private handleConnectionError(accountId: string, error: Error): void {
    const attempts = this.reconnectAttempts.get(accountId) || 0;
    this.reconnectAttempts.set(accountId, attempts + 1);

    if (attempts < this.maxReconnectAttempts) {
      logger.info('Scheduling reconnect attempt', { 
        accountId, 
        attempt: attempts + 1, 
        maxAttempts: this.maxReconnectAttempts 
      });
      this.scheduleReconnect(accountId);
    } else {
      logger.error('Max reconnect attempts reached', { accountId });
      // Disable account
      Account.findOneAndUpdate(
        { accountId },
        { enabled: false },
        { new: true }
      ).catch(updateError => {
        logger.error('Failed to disable account:', updateError);
      });
    }
  }

  private scheduleReconnect(accountId: string): void {
    setTimeout(async () => {
      try {
        const connection = this.connections.get(accountId);
        if (connection && !connection.connected) {
          logger.info('Attempting to reconnect IMAP account', { accountId });
          await this.connectAccount(accountId);
        }
      } catch (error) {
        logger.error('Reconnect attempt failed:', { accountId, error });
      }
    }, this.reconnectDelay);
  }

  async syncAccount(accountId: string): Promise<void> {
    const connection = this.connections.get(accountId);
    if (!connection) {
      throw new Error(`Account ${accountId} not found`);
    }

    if (!connection.connected) {
      await this.connectAccount(accountId);
    }

    await this.syncAllFolders(accountId);
    
    // Update last sync time
    await Account.findOneAndUpdate(
      { accountId },
      { lastSync: new Date() }
    );

    logger.info('Account sync completed', { accountId });
  }

  getConnectionStatus(accountId: string): any {
    const connection = this.connections.get(accountId);
    if (!connection) {
      return { status: 'not_configured' };
    }

    return {
      status: connection.connected ? 'connected' : 'disconnected',
      lastSync: connection.lastSync,
      reconnectAttempts: this.reconnectAttempts.get(accountId) || 0
    };
  }

  async getAllConnectionStatuses(): Promise<any> {
    const statuses: any = {};
    
    for (const [accountId, connection] of this.connections) {
      statuses[accountId] = this.getConnectionStatus(accountId);
    }

    return statuses;
  }

  async startAllConnections(): Promise<void> {
    try {
      // Get all enabled accounts
      const accounts = await Account.find({ enabled: true });
      
      logger.info('Starting IMAP connections for enabled accounts', { count: accounts.length });

      if (accounts.length === 0) {
        logger.info('No enabled IMAP accounts found, skipping IMAP initialization');
        return;
      }

      for (const account of accounts) {
        try {
          await this.addAccount(account);
        } catch (error) {
          logger.error('Failed to start connection for account:', { 
            accountId: account.accountId, 
            error: (error as Error).message 
          });
          // Don't throw error for individual account failures
        }
      }
    } catch (error) {
      logger.error('Failed to start IMAP connections:', error);
      // Don't throw error - let server start even if IMAP fails
    }
  }

  async stopAllConnections(): Promise<void> {
    logger.info('Stopping all IMAP connections');
    
    for (const [accountId, connection] of this.connections) {
      try {
        if (connection.connected) {
          connection.imap.end();
        }
      } catch (error) {
        logger.error('Error stopping connection:', { accountId, error });
      }
    }

    this.connections.clear();
    this.reconnectAttempts.clear();
  }
}

export const imapService = new ImapService();