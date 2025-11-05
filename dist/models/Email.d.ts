import mongoose, { Document } from 'mongoose';
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
export declare enum DeliveryStatus {
    RECEIVED = "received",
    SENT = "sent",
    FAILED = "failed",
    QUEUED = "queued"
}
export declare enum EmailCategory {
    INTERESTED = "Interested",
    MEETING_BOOKED = "Meeting Booked",
    NOT_INTERESTED = "Not Interested",
    SPAM = "Spam",
    OUT_OF_OFFICE = "Out of Office"
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
export declare const Email: mongoose.Model<IEmail, {}, {}, {}, mongoose.Document<unknown, {}, IEmail, {}, {}> & IEmail & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Email.d.ts.map