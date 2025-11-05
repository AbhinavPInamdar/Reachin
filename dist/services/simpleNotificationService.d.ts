export declare class SimpleNotificationService {
    static sendNotification(emailId: string): Promise<{
        sent: boolean;
        reason: string;
    }>;
    private static sendWebhook;
    private static sendSlackNotification;
    static testNotification(): Promise<{
        success: boolean;
        error: string;
        message?: undefined;
        results?: undefined;
    } | {
        success: boolean;
        message: string;
        results: string[];
        error?: undefined;
    }>;
}
//# sourceMappingURL=simpleNotificationService.d.ts.map