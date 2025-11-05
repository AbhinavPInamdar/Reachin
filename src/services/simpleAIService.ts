
import { Email, EmailCategory } from '../models/Email';

export class SimpleAIService {
  

  static async categorizeEmail(emailId: string) {
    try {
      if (!emailId || !emailId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error(`Invalid email ID format: ${emailId}`);
      }
      
      const email = await Email.findById(emailId);
      if (!email) {
        throw new Error('Email not found');
      }

      const category = this.getCategory(email.subject || '', email.body.text || '');
      const confidence = 0.8; 

      email.category = category;
      email.categoryConfidence = confidence;
      await email.save();

      return { category, confidence };
    } catch (error) {
      console.error('Error categorizing email:', error);
      throw error;
    }
  }

  static categorizeByContent(subject: string, body: string): { category: EmailCategory; confidence: number } {
    const category = this.getCategory(subject, body);
    return { category, confidence: 0.8 };
  }

  private static getCategory(subject: string, body: string): EmailCategory {
    const text = (subject + ' ' + body).toLowerCase();

    if (text.includes('interview') || text.includes('meeting') || text.includes('schedule')) {
      return EmailCategory.MEETING_BOOKED;
    }
    
    if (text.includes('interested') || text.includes('next steps') || text.includes('proceed')) {
      return EmailCategory.INTERESTED;
    }
    
    if (text.includes('rejected') || text.includes('not selected') || text.includes('unfortunately')) {
      return EmailCategory.NOT_INTERESTED;
    }
    
    if (text.includes('unsubscribe') || text.includes('newsletter') || text.includes('promotion')) {
      return EmailCategory.SPAM;
    }
    
    if (text.includes('out of office') || text.includes('vacation') || text.includes('away')) {
      return EmailCategory.OUT_OF_OFFICE;
    }

    return EmailCategory.NOT_INTERESTED;
  }

  static async categorizeAllEmails(accountId?: string) {
    try {
      const query: any = { category: { $exists: false } };
      if (accountId) query.accountId = accountId;

      const emails = await Email.find(query).limit(20);
      
      let processed = 0;
      for (const email of emails) {
        try {
          await this.categorizeEmail((email._id as any).toString());
          processed++;
        } catch (error) {
          console.error('Error categorizing email:', email._id, error);
        }
      }

      return { processed, total: emails.length };
    } catch (error) {
      console.error('Error batch categorizing:', error);
      throw error;
    }
  }
}