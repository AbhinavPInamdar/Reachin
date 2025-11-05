import axios from 'axios';
import { Email, EmailCategory } from '../models/Email';

export class SimpleNotificationService {
  
  static async sendNotification(emailId: string) {
    try {
      const email = await Email.findById(emailId);
      if (!email) {
        throw new Error('Email not found');
      }

      if (email.category !== EmailCategory.INTERESTED) {
        return { sent: false, reason: 'Not interested email' };
      }

      // Send webhook notification
      const webhookUrl = process.env.WEBHOOK_SITE_URL;
      if (webhookUrl) {
        await this.sendWebhook(email, webhookUrl);
      }

      // Send Slack notification
      const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (slackWebhookUrl) {
        await this.sendSlackNotification(email, slackWebhookUrl);
      }

      return { sent: true, reason: 'Notifications sent' };
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  private static async sendWebhook(email: any, url: string) {
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

      await axios.post(url, payload, { timeout: 5000 });
      console.log('Webhook sent successfully');
    } catch (error) {
      console.error('Webhook failed:', (error as Error).message);
    }
  }

  private static async sendSlackNotification(email: any, webhookUrl: string) {
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

      await axios.post(webhookUrl, slackPayload, { 
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Slack notification sent successfully');
    } catch (error) {
      console.error('Slack notification failed:', (error as Error).message);
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

      // Test webhook.site
      if (webhookUrl) {
        try {
          const testPayload = {
            message: 'Test notification from ReachInbox',
            test: true,
            timestamp: new Date().toISOString()
          };
          await axios.post(webhookUrl, testPayload, { timeout: 5000 });
          results.push('Webhook.site: Success');
        } catch (error) {
          results.push(`Webhook.site: Failed - ${(error as Error).message}`);
        }
      }

      // Test Slack
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
          await axios.post(slackWebhookUrl, slackTestPayload, { 
            timeout: 5000,
            headers: { 'Content-Type': 'application/json' }
          });
          results.push('Slack:  Success');
        } catch (error) {
          results.push(`Slack: Failed - ${(error as Error).message}`);
        }
      }

      return { 
        success: true, 
        message: 'Test notifications completed',
        results: results
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}