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

      const webhookUrl = process.env.WEBHOOK_SITE_URL;
      if (webhookUrl) {
        await this.sendWebhook(email, webhookUrl);
      }

      return { sent: true, reason: 'Notification sent' };
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

      await axios.post(webhookUrl, testPayload, { timeout: 5000 });
      return { success: true, message: 'Test notification sent' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}