export declare function isValidObjectId(id: string): boolean;
export declare function isValidEmail(email: string): boolean;
export declare function validateImapConfig(config: any): {
    valid: boolean;
    errors: string[];
};
export declare function validateAccountData(data: any): {
    valid: boolean;
    errors: string[];
};
export declare function sanitizeString(input: string): string;
export declare function validatePagination(limit?: string, offset?: string): {
    limit: number;
    offset: number;
};
//# sourceMappingURL=validation.d.ts.map