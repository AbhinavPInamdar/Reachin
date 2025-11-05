"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const EmailService_1 = require("../services/EmailService");
const simpleAIService_1 = require("../services/simpleAIService");
const simpleNotificationService_1 = require("../services/simpleNotificationService");
const simpleRAGService_1 = require("../services/simpleRAGService");
const validation_1 = require("../utils/validation");
class SimpleController {
}
exports.SimpleController = SimpleController;
_a = SimpleController;
SimpleController.getEmails = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { accountId, folder, category, limit } = req.query;
    const emails = await EmailService_1.EmailService.getEmails({
        accountId,
        folder,
        category,
        limit: limit ? parseInt(limit) : 50
    });
    return res.json({
        success: true,
        data: { emails, total: emails.length }
    });
});
SimpleController.searchEmails = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({
            success: false,
            error: 'Search text is required'
        });
    }
    const emails = await EmailService_1.EmailService.searchEmails(text);
    return res.json({
        success: true,
        data: { emails, total: emails.length }
    });
});
SimpleController.categorizeEmail = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!(0, validation_1.isValidObjectId)(id)) {
        return res.status(400).json({ error: 'Invalid email ID format' });
    }
    const result = await simpleAIService_1.SimpleAIService.categorizeEmail(id);
    return res.json({
        success: true,
        data: result
    });
});
SimpleController.batchCategorize = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { accountId } = req.body;
    const result = await simpleAIService_1.SimpleAIService.categorizeAllEmails(accountId);
    return res.json({
        success: true,
        data: result
    });
});
SimpleController.testNotification = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const result = await simpleNotificationService_1.SimpleNotificationService.testNotification();
    return res.json({
        success: true,
        data: result
    });
});
SimpleController.getStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const totalEmails = await EmailService_1.EmailService.countEmails();
    const interestedEmails = await EmailService_1.EmailService.countEmails({ category: 'Interested' });
    const meetingBookedEmails = await EmailService_1.EmailService.countEmails({ category: 'Meeting Booked' });
    const notInterestedEmails = await EmailService_1.EmailService.countEmails({ category: 'Not Interested' });
    const spamEmails = await EmailService_1.EmailService.countEmails({ category: 'Spam' });
    const outOfOfficeEmails = await EmailService_1.EmailService.countEmails({ category: 'Out of Office' });
    const categorizedEmails = await EmailService_1.EmailService.countEmails({ category: { $exists: true } });
    return res.json({
        success: true,
        data: {
            totalEmails,
            interestedEmails,
            meetingBookedEmails,
            notInterestedEmails,
            spamEmails,
            outOfOfficeEmails,
            categorizedEmails,
            uncategorizedEmails: totalEmails - categorizedEmails
        }
    });
});
SimpleController.getNotificationConfig = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const config = {
        webhookSiteUrl: process.env.WEBHOOK_SITE_URL || '',
        enableWebhook: !!process.env.WEBHOOK_SITE_URL,
        enableSlack: !!process.env.SLACK_WEBHOOK_URL
    };
    return res.json({
        success: true,
        data: config
    });
});
SimpleController.updateNotificationConfig = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { webhookSiteUrl, enableWebhook } = req.body;
    return res.json({
        success: true,
        message: 'Configuration updated (demo mode)'
    });
});
SimpleController.sendBulkNotifications = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { accountId, limit = 5 } = req.body;
    const query = { category: 'Interested' };
    if (accountId)
        query.accountId = accountId;
    const emails = await EmailService_1.EmailService.getEmails({ ...query, limit });
    let successful = 0;
    for (const email of emails) {
        try {
            await simpleNotificationService_1.SimpleNotificationService.sendNotification(email._id.toString());
            successful++;
        }
        catch (error) {
            console.error('Notification failed:', error);
        }
    }
    return res.json({
        success: true,
        data: {
            processed: emails.length,
            successful: successful,
            failed: emails.length - successful,
            emails: emails.map(email => ({
                messageId: email.messageId,
                from: email.from,
                subject: email.subject
            }))
        }
    });
});
SimpleController.generateReplySuggestions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const result = await simpleRAGService_1.SimpleRAGService.generateReplySuggestions(id);
    return res.json({
        success: true,
        data: result
    });
});
SimpleController.getRAGContexts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const contexts = simpleRAGService_1.SimpleRAGService.getContexts();
    return res.json({
        success: true,
        data: contexts
    });
});
SimpleController.storeRAGContext = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { content, type } = req.body;
    if (!content || !type) {
        return res.status(400).json({
            success: false,
            error: 'Content and type are required'
        });
    }
    const contextId = await simpleRAGService_1.SimpleRAGService.storeContext(content, type);
    return res.json({
        success: true,
        data: { contextId, message: 'Context stored successfully' }
    });
});
SimpleController.testRAGSystem = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { emailText } = req.body;
    if (!emailText) {
        return res.status(400).json({
            success: false,
            error: 'Email text is required'
        });
    }
    const mockEmail = {
        _id: 'test-email',
        subject: emailText.split('\n')[0] || 'Test Email',
        body: { text: emailText },
        from: 'test@example.com'
    };
    const contexts = simpleRAGService_1.SimpleRAGService.getContexts();
    const suggestions = simpleRAGService_1.SimpleRAGService['generateSimpleSuggestions'](mockEmail, contexts);
    return res.json({
        success: true,
        data: {
            input: emailText,
            suggestions: suggestions,
            contextUsed: contexts.map((c) => c.id)
        }
    });
});
//# sourceMappingURL=simpleController.js.map