import { Request, Response } from 'express';
declare class AccountController {
    getAccounts: (req: Request, res: Response, next: import("express").NextFunction) => void;
    createAccount: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getAccountById: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateAccount: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteAccount: (req: Request, res: Response, next: import("express").NextFunction) => void;
    testConnection: (req: Request, res: Response, next: import("express").NextFunction) => void;
    toggleAccount: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
export declare const accountController: AccountController;
export {};
//# sourceMappingURL=accountController.d.ts.map