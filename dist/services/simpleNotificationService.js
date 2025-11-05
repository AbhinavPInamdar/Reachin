"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleNotificationService = void 0;
const axios_1 = __importDefault(require("axios"));
const Email_1 = require("../models/Email");
class SimpleNotificationService {
    static async sendNotification(emailId) {
        try {
            const email = await Email_1.Email.findById(emailId);
            if (!email) {
                throw new Error('Email not found');
            }
            if (email.category !== Email_1.EmailCategory.INTERESTED) {
                return { sent: false, reason: 'Not interested email' };
            }
            const webhookUrl = process.env.WEBHOOK_SITE_URL;
            if (webhookUrl) {
                await this.sendWebhook(email, webhookUrl);
            }
            return { sent: true, reason: 'Notification sent' };
        }
        catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    }
    static async sendWebhook(email, url) {
        try {
            const payload = {
                message: 'New interested email received!',
                email: {
                    from: email.from,
                    subject: email.subject,
                    category: email.category,
                    receivedAt: email.receivedAt
                },
                timestamp: new Date().toISOString()
            };
            await axios_1.default.post(url, payload, { timeout: 5000 });
            console.log('Webhook sent successfully');
        }
        catch (error) {
            console.error('Webhook failed:', error.message);
        }
    }
    static async testNotification() {
        try {
            const webhookUrl = process.env.WEBHOOK_SITE_URL;
            if (!webhookUrl) {
                return { success: false, error: 'No webhook URL configured' };
            }
            const testPayload = {
                message: 'Test notification from ReachInbox',
                test: true,
                timestamp: new Date().toISOString()
            };
            await axios_1.default.post(webhookUrl, testPayload, { timeout: 5000 });
            return { success: true, message: 'Test notification sent' };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
}
exports.SimpleNotificationService = SimpleNotificationService;
//# sourceMappingURL=simpleNotificationService.js.map