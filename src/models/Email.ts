import mongoose, { Document, Schema } from 'mongoose';

export interface IAttachment {
  filename: string;
  contentType?: string;
  size: number;
  checksum?: string;
}

export interface IEmailBody {
  text?: string;
  html?: string;
}

export enum DeliveryStatus {
  RECEIVED = 'received',
  SENT = 'sent',
  FAILED = 'failed',
  QUEUED = 'queued'
}

export enum EmailCategory {
  INTERESTED = 'Interested',
  MEETING_BOOKED = 'Meeting Booked',
  NOT_INTERESTED = 'Not Interested',
  SPAM = 'Spam',
  OUT_OF_OFFICE = 'Out of Office'
}

export interface IEmail extends Document {
  messageId: string;
  accountId: string;
  threadId?: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body: IEmailBody;
  attachments?: IAttachment[];
  receivedAt: Date;
  size?: number;
  folder?: string;
  tags?: string[];
  status: DeliveryStatus;
  category?: EmailCategory;
  categoryConfidence?: number;
  headers?: Map<string, string>;
  metadata?: Map<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>({
  filename: { type: String, required: true },
  contentType: { type: String },
  size: { type: Number, required: true, min: 0 },
  checksum: { type: String }
});

const EmailBodySchema = new Schema<IEmailBody>({
  text: { type: String },
  html: { type: String }
});

const EmailSchema = new Schema<IEmail>({
  messageId: { 
    type: String, 
    required: true,
    index: true
  },
  accountId: { 
    type: String, 
    required: true,
    index: true
  },
  threadId: { 
    type: String,
    index: true
  },
  from: { 
    type: String, 
    required: true,
    index: true
  },
  to: [{ 
    type: String, 
    required: true 
  }],
  cc: [{ type: String }],
  bcc: [{ type: String }],
  subject: { 
    type: String,
    index: 'text'
  },
  body: {
    type: EmailBodySchema,
    required: true
  },
  attachments: [AttachmentSchema],
  receivedAt: { 
    type: Date, 
    required: true,
    index: true
  },
  size: { 
    type: Number,
    min: 0
  },
  folder: { 
    type: String,
    index: true
  },
  tags: [{ type: String }],
  status: { 
    type: String, 
    enum: Object.values(DeliveryStatus),
    required: true,
    default: DeliveryStatus.RECEIVED
  },
  category: {
    type: String,
    enum: Object.values(EmailCategory),
    index: true
  },
  categoryConfidence: {
    type: Number,
    min: 0,
    max: 1
  },
  headers: {
    type: Map,
    of: String
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  }
}, {
  timestamps: true,
  collection: 'emails'
});

EmailSchema.index({ messageId: 1, accountId: 1 }, { unique: true });
EmailSchema.index({ accountId: 1, threadId: 1, receivedAt: -1 });
EmailSchema.index({ accountId: 1, folder: 1, receivedAt: -1 });
EmailSchema.index({ category: 1, receivedAt: -1 });

EmailSchema.index({ 
  subject: 'text', 
  'body.text': 'text' 
}, {
  weights: {
    subject: 10,
    'body.text': 5
  },
  name: 'email_text_search'
});

export const Email = mongoose.model<IEmail>('Email', EmailSchema);