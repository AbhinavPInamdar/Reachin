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
            const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
            if (slackWebhookUrl) {
                await this.sendSlackNotification(email, slackWebhookUrl);
            }
            return { sent: true, reason: 'Notifications sent' };
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
    static async sendSlackNotification(email, webhookUrl) {
        try {
            const slackPayload = {
                text: "🎯 New Interested Email Received!",
                blocks: [
                    {
                        type: "header",
                        text: {
                            type: "plain_text",
                            text: " New Interested Email"
                        }
                    },
                    {
                        type: "section",
                        fields: [
                            {
                                type: "mrkdwn",
                                text: `*From:* ${email.from}`
                            },
                            {
                                type: "mrkdwn",
                                text: `*Subject:* ${email.subject}`
                            },
                            {
                                type: "mrkdwn",
                                text: `*Category:* ${email.category}`
                            },
                            {
                                type: "mrkdwn",
                                text: `*Received:* ${new Date(email.receivedAt).toLocaleString()}`
                            }
                        ]
                    },
                    {
                        type: "context",
                        elements: [
                            {
                                type: "mrkdwn",
                                text: `ReachInbox Email Aggregator • ${new Date().toLocaleString()}`
                            }
                        ]
                    }
                ]
            };
            await axios_1.default.post(webhookUrl, slackPayload, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('Slack notification sent successfully');
        }
        catch (error) {
            console.error('Slack notification failed:', error.message);
        }
    }
    static async testNotification() {
        try {
            const webhookUrl = process.env.WEBHOOK_SITE_URL;
            const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
            if (!webhookUrl && !slackWebhookUrl) {
                return { success: false, error: 'No webhook URLs configured' };
            }
            const results = [];
            if (webhookUrl) {
                try {
                    const testPayload = {
                        message: 'Test notification from ReachInbox',
                        test: true,
                        timestamp: new Date().toISOString()
                    };
                    await axios_1.default.post(webhookUrl, testPayload, { timeout: 5000 });
                    results.push('Webhook.site: Success');
                }
                catch (error) {
                    results.push(`Webhook.site: Failed - ${error.message}`);
                }
            }
            if (slackWebhookUrl) {
                try {
                    const slackTestPayload = {
                        text: "🧪 Test notification from ReachInbox Email Aggregator",
                        blocks: [
                            {
                                type: "section",
                                text: {
                                    type: "mrkdwn",
                                    text: "🧪 *Test Notification*\n\nThis is a test message to verify Slack integration is working correctly."
                                }
                            },
                            {
                                type: "context",
                                elements: [
                                    {
                                        type: "mrkdwn",
                                        text: ` ReachInbox Email Aggregator • ${new Date().toLocaleString()}`
                                    }
                                ]
                            }
                        ]
                    };
                    await axios_1.default.post(slackWebhookUrl, slackTestPayload, {
                        timeout: 5000,
                        headers: { 'Content-Type': 'application/json' }
                    });
                    results.push('Slack:  Success');
                }
                catch (error) {
                    results.push(`Slack: Failed - ${error.message}`);
                }
            }
            return {
                success: true,
                message: 'Test notifications completed',
                results: results
            };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
}
exports.SimpleNotificationService = SimpleNotificationService;
//# sourceMappingURL=simpleNotificationService.js.map