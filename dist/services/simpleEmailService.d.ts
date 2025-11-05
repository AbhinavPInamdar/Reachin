export declare class SimpleEmailService {
    static getEmails(filters?: any): Promise<any[]>;
    static searchEmails(searchText: string, filters?: any): Promise<any[]>;
    static getEmailById(id: string): Promise<(import("mongoose").Document<unknown, {}, import("../models/Email").IEmail, {}, {}> & import("../models/Email").IEmail & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }) | null>;
    static countEmails(filters?: any): Promise<number>;
    static indexEmailInElasticsearch(email: any): Promise<void>;
    static deleteEmailFromElasticsearch(emailId: string): Promise<void>;
    static getSearchStats(): Promise<any>;
}
//# sourceMappingURL=simpleEmailService.d.ts.map