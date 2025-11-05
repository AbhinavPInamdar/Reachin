export declare class EmailService {
    static getEmails(filters?: any): Promise<any[]>;
    static searchEmails(searchText: string, filters?: any): Promise<any[]>;
    static getEmailById(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../models/Email").IEmail, {}, {}> & import("../models/Email").IEmail & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    static countEmails(filters?: any): Promise<number>;
    static indexEmail(email: any): Promise<void>;
    static deleteEmailFromIndex(emailId: string): Promise<void>;
    static getStats(): Promise<any>;
    private static getEmailsFromMongoDB;
    private static searchEmailsInMongoDB;
}
//# sourceMappingURL=EmailService.d.ts.map