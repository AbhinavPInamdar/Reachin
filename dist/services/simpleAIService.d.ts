import { EmailCategory } from '../models/Email';
export declare class SimpleAIService {
    static categorizeEmail(emailId: string): Promise<{
        category: EmailCategory;
        confidence: number;
    }>;
    static categorizeByContent(subject: string, body: string): {
        category: EmailCategory;
        confidence: number;
    };
    private static getCategory;
    static categorizeAllEmails(accountId?: string): Promise<{
        processed: number;
        total: number;
    }>;
}
//# sourceMappingURL=simpleAIService.d.ts.map