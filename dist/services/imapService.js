"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.imapService = exports.ImapService = void 0;
const imap_1 = __importDefault(require("imap"));
const mailparser_1 = require("mailparser");
const events_1 = require("events");
const logger_1 = require("../utils/logger");
const Email_1 = require("../models/Email");
const Account_1 = require("../models/Account");
const EmailService_1 = require("./EmailService");
const simpleAIService_1 = require("./simpleAIService");
const simpleNotificationService_1 = require("./simpleNotificationService");
class ImapService extends events_1.EventEmitter {
    constructor() {
        super();
        this.connections = new Map();
        this.reconnectAttempts = new Map();
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000;
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.on('newEmail', async (email, accountId) => {
            try {
                const categorization = simpleAIService_1.SimpleAIService.categorizeByContent(email.subject || '', email.body?.text || '');
                await Email_1.Email.findByIdAndUpdate(email._id, {
                    category: categorization.category,
                    categoryConfidence: categorization.confidence
                });
                const updatedEmail = await Email_1.Email.findById(email._id);
                if (updatedEmail) {
                    await EmailService_1.EmailService.indexEmail(updatedEmail);
                }
                if (categorization.category === 'Interested') {
                    const notificationMessage = `New interested email from ${email.from}: ${email.subject || 'No Subject'}`;
                    await simpleNotificationService_1.SimpleNotificationService.sendNotification(notificationMessage);
                }
                logger_1.logger.info('New email processed', {
                    accountId,
                    messageId: email.messageId,
                    category: categorization.category
                });
            }
            catch (error) {
                logger_1.logger.error('Failed to process new email:', error);
            }
        });
    }
    async addAccount(account) {
        try {
            if (!account.imapConfig) {
                throw new Error('IMAP configuration is required');
            }
            const imap = new imap_1.default({
                user: account.imapConfig.username,
                password: account.imapConfig.password,
                host: account.imapConfig.host,
                port: account.imapConfig.port,
                tls: account.imapConfig.secure,
                tlsOptions: { rejectUnauthorized: false },
                keepalive: true
            });
            const connection = {
                imap,
                account,
                connected: false,
                lastSync: new Date()
            };
            this.connections.set(account.accountId, connection);
            await this.connectAccount(account.accountId);
            logger_1.logger.info('IMAP account added successfully', { accountId: account.accountId });
        }
        catch (error) {
            logger_1.logger.error('Failed to add IMAP account:', error);
            throw error;
        }
    }
    async removeAccount(accountId) {
        const connection = this.connections.get(accountId);
        if (connection) {
            if (connection.connected) {
                connection.imap.end();
            }
            this.connections.delete(accountId);
            this.reconnectAttempts.delete(accountId);
            logger_1.logger.info('IMAP account removed', { accountId });
        }
    }
    async connectAccount(accountId) {
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
                    logger_1.logger.info('IMAP connection established', { accountId });
                    await this.syncAllFolders(accountId);
                    await this.startIdleMonitoring(accountId);
                    resolve();
                }
                catch (error) {
                    logger_1.logger.error('Failed to setup IMAP connection:', error);
                    reject(error);
                }
            });
            imap.once('error', (error) => {
                connection.connected = false;
                logger_1.logger.error('IMAP connection error:', { accountId, error: error.message });
                this.handleConnectionError(accountId, error);
                reject(error);
            });
            imap.once('end', () => {
                connection.connected = false;
                logger_1.logger.info('IMAP connection ended', { accountId });
                this.scheduleReconnect(accountId);
            });
            try {
                imap.connect();
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async syncAllFolders(accountId) {
        const connection = this.connections.get(accountId);
        if (!connection || !connection.connected) {
            throw new Error(`Account ${accountId} not connected`);
        }
        const { imap, account } = connection;
        const folders = account.folders || ['INBOX'];
        for (const folder of folders) {
            try {
                await this.syncFolder(accountId, folder);
            }
            catch (error) {
                logger_1.logger.error('Failed to sync folder:', { accountId, folder, error });
            }
        }
    }
    async syncFolder(accountId, folderName) {
        const connection = this.connections.get(accountId);
        if (!connection || !connection.connected) {
            return;
        }
        const { imap } = connection;
        return new Promise((resolve, reject) => {
            imap.openBox(folderName, true, async (error, box) => {
                if (error) {
                    logger_1.logger.error('Failed to open folder:', { accountId, folderName, error });
                    reject(error);
                    return;
                }
                try {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    const searchCriteria = ['ALL', ['SINCE', thirtyDaysAgo]];
                    imap.search(searchCriteria, async (searchError, uids) => {
                        if (searchError) {
                            logger_1.logger.error('IMAP search failed:', { accountId, folderName, searchError });
                            reject(searchError);
                            return;
                        }
                        if (!uids || uids.length === 0) {
                            logger_1.logger.info('No emails found in folder', { accountId, folderName });
                            resolve();
                            return;
                        }
                        logger_1.logger.info('Found emails to sync', { accountId, folderName, count: uids.length });
                        const batchSize = 10;
                        for (let i = 0; i < uids.length; i += batchSize) {
                            const batch = uids.slice(i, i + batchSize);
                            await this.processBatch(accountId, folderName, batch);
                        }
                        resolve();
                    });
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    }
    async processBatch(accountId, folderName, uids) {
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
            const emails = [];
            fetch.on('message', (msg, seqno) => {
                let buffer = '';
                let attributes = null;
                msg.on('body', (stream) => {
                    stream.on('data', (chunk) => {
                        buffer += chunk.toString('utf8');
                    });
                });
                msg.once('attributes', (attrs) => {
                    attributes = attrs;
                });
                msg.once('end', async () => {
                    try {
                        const parsed = await (0, mailparser_1.simpleParser)(buffer);
                        const emailData = {
                            messageId: parsed.messageId || `${accountId}-${seqno}-${Date.now()}`,
                            accountId,
                            threadId: parsed.references?.[0] || parsed.inReplyTo,
                            from: parsed.from?.text || '',
                            to: parsed.to?.text ? [parsed.to.text] : [],
                            cc: parsed.cc?.text ? [parsed.cc.text] : [],
                            bcc: parsed.bcc?.text ? [parsed.bcc.text] : [],
                            subject: parsed.subject,
                            body: {
                                text: parsed.text || '',
                                html: parsed.html || ''
                            },
                            attachments: parsed.attachments?.map((att) => ({
                                filename: att.filename || 'unknown',
                                contentType: att.contentType,
                                size: att.size || 0
                            })) || [],
                            receivedAt: parsed.date || new Date(),
                            size: buffer.length,
                            folder: folderName,
                            status: Email_1.DeliveryStatus.RECEIVED,
                            headers: new Map(Object.entries(parsed.headers || {}))
                        };
                        emails.push(emailData);
                    }
                    catch (parseError) {
                        logger_1.logger.error('Failed to parse email:', { accountId, seqno, parseError });
                    }
                });
            });
            fetch.once('error', (fetchError) => {
                logger_1.logger.error('IMAP fetch error:', { accountId, folderName, fetchError });
                reject(fetchError);
            });
            fetch.once('end', async () => {
                try {
                    for (const emailData of emails) {
                        await this.saveEmail(emailData);
                    }
                    logger_1.logger.info('Batch processed successfully', {
                        accountId,
                        folderName,
                        count: emails.length
                    });
                    resolve();
                }
                catch (error) {
                    logger_1.logger.error('Failed to save email batch:', error);
                    reject(error);
                }
            });
        });
    }
    async saveEmail(emailData) {
        try {
            const existingEmail = await Email_1.Email.findOne({
                messageId: emailData.messageId,
                accountId: emailData.accountId
            });
            if (existingEmail) {
                logger_1.logger.debug('Email already exists, skipping', { messageId: emailData.messageId });
                return;
            }
            const duplicateAcrossAccounts = await Email_1.Email.findOne({
                messageId: emailData.messageId
            });
            if (duplicateAcrossAccounts) {
                logger_1.logger.debug('Email already exists in another account, skipping', {
                    messageId: emailData.messageId,
                    existingAccount: duplicateAcrossAccounts.accountId,
                    newAccount: emailData.accountId
                });
                return;
            }
            const email = new Email_1.Email(emailData);
            await email.save();
            this.emit('newEmail', email, emailData.accountId);
            logger_1.logger.debug('Email saved successfully', { messageId: emailData.messageId });
        }
        catch (error) {
            logger_1.logger.error('Failed to save email:', error);
            throw error;
        }
    }
    async startIdleMonitoring(accountId) {
        const connection = this.connections.get(accountId);
        if (!connection || !connection.connected) {
            return;
        }
        const { imap } = connection;
        try {
            imap.openBox('INBOX', false, (error, box) => {
                if (error) {
                    logger_1.logger.error('Failed to open INBOX for IDLE:', { accountId, error });
                    return;
                }
                imap.on('mail', async (numNewMsgs) => {
                    logger_1.logger.info('New mail detected via IDLE', { accountId, numNewMsgs });
                    try {
                        await this.syncFolder(accountId, 'INBOX');
                    }
                    catch (syncError) {
                        logger_1.logger.error('Failed to sync new emails:', { accountId, syncError });
                    }
                });
                imap.on('ready', () => {
                    if (imap.state === 'authenticated') {
                        logger_1.logger.info('Starting IDLE monitoring', { accountId });
                    }
                });
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to start IDLE monitoring:', { accountId, error });
        }
    }
    handleConnectionError(accountId, error) {
        const attempts = this.reconnectAttempts.get(accountId) || 0;
        this.reconnectAttempts.set(accountId, attempts + 1);
        if (attempts < this.maxReconnectAttempts) {
            logger_1.logger.info('Scheduling reconnect attempt', {
                accountId,
                attempt: attempts + 1,
                maxAttempts: this.maxReconnectAttempts
            });
            this.scheduleReconnect(accountId);
        }
        else {
            logger_1.logger.error('Max reconnect attempts reached', { accountId });
            Account_1.Account.findOneAndUpdate({ accountId }, { enabled: false }, { new: true }).catch(updateError => {
                logger_1.logger.error('Failed to disable account:', updateError);
            });
        }
    }
    scheduleReconnect(accountId) {
        setTimeout(async () => {
            try {
                const connection = this.connections.get(accountId);
                if (connection && !connection.connected) {
                    logger_1.logger.info('Attempting to reconnect IMAP account', { accountId });
                    await this.connectAccount(accountId);
                }
            }
            catch (error) {
                logger_1.logger.error('Reconnect attempt failed:', { accountId, error });
            }
        }, this.reconnectDelay);
    }
    async syncAccount(accountId) {
        const connection = this.connections.get(accountId);
        if (!connection) {
            throw new Error(`Account ${accountId} not found`);
        }
        if (!connection.connected) {
            await this.connectAccount(accountId);
        }
        await this.syncAllFolders(accountId);
        await Account_1.Account.findOneAndUpdate({ accountId }, { lastSync: new Date() });
        logger_1.logger.info('Account sync completed', { accountId });
    }
    getConnectionStatus(accountId) {
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
    async getAllConnectionStatuses() {
        const statuses = {};
        for (const [accountId, connection] of this.connections) {
            statuses[accountId] = this.getConnectionStatus(accountId);
        }
        return statuses;
    }
    async startAllConnections() {
        try {
            const accounts = await Account_1.Account.find({ enabled: true });
            logger_1.logger.info('Starting IMAP connections for enabled accounts', { count: accounts.length });
            if (accounts.length === 0) {
                logger_1.logger.info('No enabled IMAP accounts found, skipping IMAP initialization');
                return;
            }
            for (const account of accounts) {
                try {
                    await this.addAccount(account);
                }
                catch (error) {
                    logger_1.logger.error('Failed to start connection for account:', {
                        accountId: account.accountId,
                        error: error.message
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to start IMAP connections:', error);
        }
    }
    async stopAllConnections() {
        logger_1.logger.info('Stopping all IMAP connections');
        for (const [accountId, connection] of this.connections) {
            try {
                if (connection.connected) {
                    connection.imap.end();
                }
            }
            catch (error) {
                logger_1.logger.error('Error stopping connection:', { accountId, error });
            }
        }
        this.connections.clear();
        this.reconnectAttempts.clear();
    }
}
exports.ImapService = ImapService;
exports.imapService = new ImapService();
//# sourceMappingURL=imapService.js.map