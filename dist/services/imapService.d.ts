import { EventEmitter } from 'events';
import { IAccount } from '../models/Account';
export declare class ImapService extends EventEmitter {
    private connections;
    private reconnectAttempts;
    private maxReconnectAttempts;
    private reconnectDelay;
    constructor();
    private setupEventHandlers;
    addAccount(account: IAccount): Promise<void>;
    removeAccount(accountId: string): Promise<void>;
    private connectAccount;
    private syncAllFolders;
    private syncFolder;
    private processBatch;
    private saveEmail;
    private startIdleMonitoring;
    private handleConnectionError;
    private scheduleReconnect;
    syncAccount(accountId: string): Promise<void>;
    getConnectionStatus(accountId: string): any;
    getAllConnectionStatuses(): Promise<any>;
    startAllConnections(): Promise<void>;
    stopAllConnections(): Promise<void>;
}
export declare const imapService: ImapService;
//# sourceMappingURL=imapService.d.ts.map