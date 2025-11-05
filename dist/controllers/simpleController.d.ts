import { Request, Response } from 'express';
export declare class SimpleController {
    static getEmails: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static searchEmails: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static categorizeEmail: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static batchCategorize: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static testNotification: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getNotificationConfig: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateNotificationConfig: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static sendBulkNotifications: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static generateReplySuggestions: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getRAGContexts: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static storeRAGContext: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static testRAGSystem: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=simpleController.d.ts.map