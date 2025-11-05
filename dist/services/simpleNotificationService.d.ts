export declare class SimpleNotificationService {
    static sendNotification(emailId: string): Promise<{
        sent: boolean;
        reason: string;
    }>;
    private static sendWebhook;
    static testNotification(): Promise<{
        success: boolean;
        error: string;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        error?: undefined;
    }>;
}
//# sourceMappingURL=simpleNotificationService.d.ts.map