import mongoose, { Document } from 'mongoose';
export declare enum Provider {
    IMAP = "imap",
    GMAIL = "gmail",
    EXCHANGE = "exchange",
    SMTP = "smtp"
}
export interface IOAuthTokens {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
}
export interface IIMAPConfig {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
}
export interface IAccount extends Document {
    accountId: string;
    provider: Provider;
    username: string;
    email: string;
    displayName?: string;
    enabled: boolean;
    imapConfig?: IIMAPConfig;
    oauthTokens?: IOAuthTokens;
    settings: Map<string, any>;
    lastSync?: Date;
    syncFrequencyMinutes: number;
    folders: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const Account: mongoose.Model<IAccount, {}, {}, {}, mongoose.Document<unknown, {}, IAccount, {}, {}> & IAccount & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Account.d.ts.map