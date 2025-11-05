"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Email = exports.EmailCategory = exports.DeliveryStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var DeliveryStatus;
(function (DeliveryStatus) {
    DeliveryStatus["RECEIVED"] = "received";
    DeliveryStatus["SENT"] = "sent";
    DeliveryStatus["FAILED"] = "failed";
    DeliveryStatus["QUEUED"] = "queued";
})(DeliveryStatus || (exports.DeliveryStatus = DeliveryStatus = {}));
var EmailCategory;
(function (EmailCategory) {
    EmailCategory["INTERESTED"] = "Interested";
    EmailCategory["MEETING_BOOKED"] = "Meeting Booked";
    EmailCategory["NOT_INTERESTED"] = "Not Interested";
    EmailCategory["SPAM"] = "Spam";
    EmailCategory["OUT_OF_OFFICE"] = "Out of Office";
})(EmailCategory || (exports.EmailCategory = EmailCategory = {}));
const AttachmentSchema = new mongoose_1.Schema({
    filename: { type: String, required: true },
    contentType: { type: String },
    size: { type: Number, required: true, min: 0 },
    checksum: { type: String }
});
const EmailBodySchema = new mongoose_1.Schema({
    text: { type: String },
    html: { type: String }
});
const EmailSchema = new mongoose_1.Schema({
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
        of: mongoose_1.Schema.Types.Mixed
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
exports.Email = mongoose_1.default.model('Email', EmailSchema);
//# sourceMappingURL=Email.js.map