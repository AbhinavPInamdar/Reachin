"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleAIService = void 0;
const Email_1 = require("../models/Email");
const simpleNotificationService_1 = require("./simpleNotificationService");
class SimpleAIService {
    static async categorizeEmail(emailId) {
        try {
            if (!emailId || !emailId.match(/^[0-9a-fA-F]{24}$/)) {
                throw new Error(`Invalid email ID format: ${emailId}`);
            }
            const email = await Email_1.Email.findById(emailId);
            if (!email) {
                throw new Error('Email not found');
            }
            const category = this.getCategory(email.subject || '', email.body.text || '');
            const confidence = 0.8;
            email.category = category;
            email.categoryConfidence = confidence;
            await email.save();
            if (category === Email_1.EmailCategory.INTERESTED) {
                try {
                    await simpleNotificationService_1.SimpleNotificationService.sendNotification(emailId);
                    console.log('Notification sent for interested email:', emailId);
                }
                catch (notificationError) {
                    console.error('Failed to send notification:', notificationError);
                }
            }
            return { category, confidence };
        }
        catch (error) {
            console.error('Error categorizing email:', error);
            throw error;
        }
    }
    static categorizeByContent(subject, body) {
        const category = this.getCategory(subject, body);
        return { category, confidence: 0.8 };
    }
    static getCategory(subject, body) {
        const text = (subject + ' ' + body).toLowerCase();
        if (text.includes('interview') || text.includes('meeting') || text.includes('schedule')) {
            return Email_1.EmailCategory.MEETING_BOOKED;
        }
        if (text.includes('interested') || text.includes('next steps') || text.includes('proceed')) {
            return Email_1.EmailCategory.INTERESTED;
        }
        if (text.includes('rejected') || text.includes('not selected') || text.includes('unfortunately')) {
            return Email_1.EmailCategory.NOT_INTERESTED;
        }
        if (text.includes('unsubscribe') || text.includes('newsletter') || text.includes('promotion')) {
            return Email_1.EmailCategory.SPAM;
        }
        if (text.includes('out of office') || text.includes('vacation') || text.includes('away')) {
            return Email_1.EmailCategory.OUT_OF_OFFICE;
        }
        return Email_1.EmailCategory.NOT_INTERESTED;
    }
    static async categorizeAllEmails(accountId) {
        try {
            const query = { category: { $exists: false } };
            if (accountId)
                query.accountId = accountId;
            const emails = await Email_1.Email.find(query).limit(20);
            let processed = 0;
            for (const email of emails) {
                try {
                    await this.categorizeEmail(email._id.toString());
                    processed++;
                }
                catch (error) {
                    console.error('Error categorizing email:', email._id, error);
                }
            }
            return { processed, total: emails.length };
        }
        catch (error) {
            console.error('Error batch categorizing:', error);
            throw error;
        }
    }
}
exports.SimpleAIService = SimpleAIService;
//# sourceMappingURL=simpleAIService.js.map