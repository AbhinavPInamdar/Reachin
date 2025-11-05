import mongoose, { Document, Schema } from 'mongoose';

export enum Provider {
  IMAP = 'imap',
  GMAIL = 'gmail',
  EXCHANGE = 'exchange',
  SMTP = 'smtp'
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

const OAuthTokensSchema = new Schema<IOAuthTokens>({
  accessToken: { type: String },
  refreshToken: { type: String },
  expiresAt: { type: Date }
});

const IMAPConfigSchema = new Schema<IIMAPConfig>({
  host: { type: String, required: true },
  port: { type: Number, required: true },
  secure: { type: Boolean, default: true },
  username: { type: String, required: true },
  password: { type: String, required: true }
});

const AccountSchema = new Schema<IAccount>({
  accountId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  provider: { 
    type: String, 
    enum: Object.values(Provider),
    required: true,
    index: true
  },
  username: { 
    type: String, 
    required: true,
    index: true
  },
  email: { 
    type: String, 
    required: true,
    index: true
  },
  displayName: { type: String },
  enabled: { 
    type: Boolean, 
    default: true,
    index: true
  },
  imapConfig: IMAPConfigSchema,
  oauthTokens: OAuthTokensSchema,
  settings: {
    type: Map,
    of: Schema.Types.Mixed,
    default: new Map()
  },
  lastSync: { 
    type: Date,
    index: true
  },
  syncFrequencyMinutes: { 
    type: Number, 
    default: 15,
    min: 1
  },
  folders: [{ 
    type: String,
    default: ['INBOX']
  }]
}, {
  timestamps: true,
  collection: 'account_configs'
});

AccountSchema.index({ username: 1, provider: 1 });
AccountSchema.index({ enabled: 1, lastSync: 1 });

export const Account = mongoose.model<IAccount>('Account', AccountSchema);