
import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { EmailService } from '../services/EmailService';
import { SimpleAIService } from '../services/simpleAIService';
import { SimpleNotificationService } from '../services/simpleNotificationService';
import { SimpleRAGService } from '../services/simpleRAGService';
import { isValidObjectId } from '../utils/validation';

export class SimpleController {
  

  static getEmails = asyncHandler(async (req: Request, res: Response) => {
    const { accountId, folder, category, limit } = req.query;
    
    const emails = await EmailService.getEmails({
      accountId,
      folder,
      category,
      limit: limit ? parseInt(limit as string) : 50
    });

    return res.json({
      success: true,
      data: { emails, total: emails.length }
    });
  });


  static searchEmails = asyncHandler(async (req: Request, res: Response) => {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Search text is required'
      });
    }

    const emails = await EmailService.searchEmails(text);

    return res.json({
      success: true,
      data: { emails, total: emails.length }
    });
  });


  static categorizeEmail = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid email ID format' });
    }
    
    const result = await SimpleAIService.categorizeEmail(id);
    

    if (result.category === 'Interested') {
      await SimpleNotificationService.sendNotification(id);
    }

    return res.json({
      success: true,
      data: result
    });
  });


  static batchCategorize = asyncHandler(async (req: Request, res: Response) => {
    const { accountId } = req.body;
    
    const result = await SimpleAIService.categorizeAllEmails(accountId);

    return res.json({
      success: true,
      data: result
    });
  });


  static testNotification = asyncHandler(async (req: Request, res: Response) => {
    const result = await SimpleNotificationService.testNotification();

    return res.json({
      success: true,
      data: result
    });
  });


  static getStats = asyncHandler(async (req: Request, res: Response) => {
    const totalEmails = await EmailService.countEmails();
    const interestedEmails = await EmailService.countEmails({ category: 'Interested' });
    const meetingBookedEmails = await EmailService.countEmails({ category: 'Meeting Booked' });
    const notInterestedEmails = await EmailService.countEmails({ category: 'Not Interested' });
    const spamEmails = await EmailService.countEmails({ category: 'Spam' });
    const outOfOfficeEmails = await EmailService.countEmails({ category: 'Out of Office' });
    const categorizedEmails = await EmailService.countEmails({ category: { $exists: true } });

    return res.json({
      success: true,
      data: {
        totalEmails,
        interestedEmails,
        meetingBookedEmails,
        notInterestedEmails,
        spamEmails,
        outOfOfficeEmails,
        categorizedEmails,
        uncategorizedEmails: totalEmails - categorizedEmails
      }
    });
  });


  static getNotificationConfig = asyncHandler(async (req: Request, res: Response) => {
    const config = {
      webhookSiteUrl: process.env.WEBHOOK_SITE_URL || '',
      enableWebhook: !!process.env.WEBHOOK_SITE_URL,
      enableSlack: !!process.env.SLACK_WEBHOOK_URL
    };

    return res.json({
      success: true,
      data: config
    });
  });


  static updateNotificationConfig = asyncHandler(async (req: Request, res: Response) => {
    const { webhookSiteUrl, enableWebhook } = req.body;
    

    return res.json({
      success: true,
      message: 'Configuration updated (demo mode)'
    });
  });


  static sendBulkNotifications = asyncHandler(async (req: Request, res: Response) => {
    const { accountId, limit = 5 } = req.body;
    

    const query: any = { category: 'Interested' };
    if (accountId) query.accountId = accountId;
    
    const emails = await EmailService.getEmails({ ...query, limit });
    

    let successful = 0;
    for (const email of emails) {
      try {
        await SimpleNotificationService.sendNotification(email._id.toString());
        successful++;
      } catch (error) {
        console.error('Notification failed:', error);
      }
    }

    return res.json({
      success: true,
      data: {
        processed: emails.length,
        successful: successful,
        failed: emails.length - successful,
        emails: emails.map(email => ({
          messageId: email.messageId,
          from: email.from,
          subject: email.subject
        }))
      }
    });
  });


  static generateReplySuggestions = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const result = await SimpleRAGService.generateReplySuggestions(id);

    return res.json({
      success: true,
      data: result
    });
  });


  static getRAGContexts = asyncHandler(async (req: Request, res: Response) => {
    const contexts = SimpleRAGService.getContexts();

    return res.json({
      success: true,
      data: contexts
    });
  });


  static storeRAGContext = asyncHandler(async (req: Request, res: Response) => {
    const { content, type } = req.body;
    
    if (!content || !type) {
      return res.status(400).json({
        success: false,
        error: 'Content and type are required'
      });
    }

    const contextId = await SimpleRAGService.storeContext(content, type);

    return res.json({
      success: true,
      data: { contextId, message: 'Context stored successfully' }
    });
  });

  static testRAGSystem = asyncHandler(async (req: Request, res: Response) => {
    const { emailText } = req.body;
    
    if (!emailText) {
      return res.status(400).json({
        success: false,
        error: 'Email text is required'
      });
    }

    const mockEmail = {
      _id: 'test-email',
      subject: emailText.split('\n')[0] || 'Test Email',
      body: { text: emailText },
      from: 'test@example.com'
    };

    const contexts = SimpleRAGService.getContexts();
    const suggestions = (SimpleRAGService as any)['generateSimpleSuggestions'](mockEmail, contexts);

    return res.json({
      success: true,
      data: {
        input: emailText,
        suggestions: suggestions,
        contextUsed: contexts.map((c: any) => c.id)
      }
    });
  });
}