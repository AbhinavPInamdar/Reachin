import OpenAI from 'openai';
import { Email } from '../models/Email';

interface ContextData {
  id: string;
  content: string;
  type: 'product' | 'outreach' | 'response_template';
}

export class SimpleRAGService {
  private static contexts: ContextData[] = [
    {
      id: 'job_application',
      type: 'outreach',
      content: 'I am applying for software engineering positions. If the lead is interested, share the meeting booking link: https://cal.com/johndoe'
    },
    {
      id: 'product_info',
      type: 'product',
      content: 'I am a full-stack developer with 3 years of experience in React, Node.js, and TypeScript. I specialize in building scalable web applications.'
    },
    {
      id: 'meeting_template',
      type: 'response_template',
      content: 'Thank you for your interest! I would be happy to discuss this opportunity further. You can book a meeting with me here: https://cal.com/johndoe'
    },
    {
      id: 'interested_template',
      type: 'response_template',
      content: 'Thank you for reaching out! I am very interested in this opportunity. Please let me know the next steps.'
    },
    {
      id: 'follow_up_template',
      type: 'response_template',
      content: 'I wanted to follow up on our previous conversation. I am still very interested in this position and would love to hear about next steps.'
    }
  ];

  private static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'demo-key'
  });

  static async generateReplySuggestions(emailId: string): Promise<{
    suggestions: Array<{
      text: string;
      tone: string;
      confidence: number;
    }>;
    contextUsed: string[];
  }> {
    try {
      const email = await Email.findById(emailId);
      if (!email) {
        throw new Error('Email not found');
      }

      const relevantContexts = this.findRelevantContexts(email.subject || '', email.body.text || '');
      const suggestions = this.generateSimpleSuggestions(email, relevantContexts);

      return {
        suggestions,
        contextUsed: relevantContexts.map(c => c.id)
      };

    } catch (error) {
      console.error('Error generating reply suggestions:', error);
      
      return {
        suggestions: [
          {
            text: 'Thank you for your email. I will review it and get back to you soon.',
            tone: 'professional',
            confidence: 0.7
          }
        ],
        contextUsed: ['fallback']
      };
    }
  }

  private static findRelevantContexts(subject: string, body: string): ContextData[] {
    const text = (subject + ' ' + body).toLowerCase();
    const relevant: ContextData[] = [];

    if (text.includes('interview') || text.includes('meeting') || text.includes('schedule')) {
      relevant.push(this.contexts.find(c => c.id === 'meeting_template')!);
    }

    if (text.includes('interested') || text.includes('opportunity') || text.includes('position')) {
      relevant.push(this.contexts.find(c => c.id === 'interested_template')!);
      relevant.push(this.contexts.find(c => c.id === 'job_application')!);
    }

    if (text.includes('follow up') || text.includes('next steps')) {
      relevant.push(this.contexts.find(c => c.id === 'follow_up_template')!);
    }

    relevant.push(this.contexts.find(c => c.id === 'product_info')!);

    return relevant;
  }

  private static generateSimpleSuggestions(email: any, _contexts: ContextData[]): Array<{
    text: string;
    tone: string;
    confidence: number;
  }> {
    const suggestions = [];
    const emailText = (email.subject + ' ' + email.body.text).toLowerCase();

    if (emailText.includes('interview') || emailText.includes('meeting')) {
      suggestions.push({
        text: 'Thank you for your interest! I am available for an interview. You can book a convenient time slot here: https://cal.com/johndoe',
        tone: 'professional',
        confidence: 0.9
      });
    }

    if (emailText.includes('opportunity') || emailText.includes('position')) {
      suggestions.push({
        text: 'Thank you for reaching out about this opportunity! I am very interested and would love to learn more about the role and your team.',
        tone: 'enthusiastic',
        confidence: 0.85
      });
    }

    if (emailText.includes('shortlisted') || emailText.includes('next round')) {
      suggestions.push({
        text: 'Thank you for the update! I am excited about moving forward. Please let me know what the next steps are.',
        tone: 'professional',
        confidence: 0.8
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        text: 'Thank you for your email. I appreciate you reaching out and would be happy to discuss this further.',
        tone: 'professional',
        confidence: 0.7
      });
    }

    suggestions.push({
      text: 'Hi! Thanks for getting in touch. This sounds interesting - I would love to chat more about it!',
      tone: 'casual',
      confidence: 0.6
    });

    return suggestions;
  }

  static async storeContext(content: string, type: 'product' | 'outreach' | 'response_template'): Promise<string> {
    const newContext: ContextData = {
      id: `custom_${Date.now()}`,
      content,
      type
    };

    this.contexts.push(newContext);
    return newContext.id;
  }

  static getContexts(): ContextData[] {
    return [...this.contexts];
  }

  static updateContext(id: string, content: string): boolean {
    const context = this.contexts.find(c => c.id === id);
    if (context) {
      context.content = content;
      return true;
    }
    return false;
  }

  static deleteContext(id: string): boolean {
    const index = this.contexts.findIndex(c => c.id === id);
    if (index !== -1) {
      this.contexts.splice(index, 1);
      return true;
    }
    return false;
  }

  static async generateAdvancedReply(emailContent: string, contexts: ContextData[]): Promise<string> {
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'demo-key') {
        throw new Error('OpenAI API key not configured');
      }

      const contextText = contexts.map(c => c.content).join('\n\n');
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an AI assistant helping to write professional email replies. Use the provided context to generate appropriate responses.

Context Information:
${contextText}

Generate a professional, contextually appropriate reply that:
1. Acknowledges the sender's message
2. Uses relevant information from the context
3. Maintains a professional but friendly tone
4. Includes specific next steps when appropriate`
          },
          {
            role: 'user',
            content: `Please generate a reply to this email: ${emailContent}`
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      return response.choices[0]?.message?.content || 'Thank you for your email.';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw error;
    }
  }
}