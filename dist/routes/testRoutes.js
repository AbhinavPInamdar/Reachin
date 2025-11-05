"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const errorHandler_1 = require("../middleware/errorHandler");
const mockImapService_1 = require("../services/mockImapService");
const Account_1 = require("../models/Account");
const Email_1 = require("../models/Email");
const router = express_1.default.Router();
router.post('/mock-emails/:accountId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { accountId } = req.params;
    const { count = 10 } = req.body;
    const account = await Account_1.Account.findOne({ accountId });
    if (!account) {
        return res.status(404).json({
            success: false,
            error: 'Account not found'
        });
    }
    await mockImapService_1.MockIMAPService.generateMockEmails(accountId, count);
    return res.json({
        success: true,
        message: `Generated ${count} mock emails for account ${accountId}`
    });
}));
router.delete('/emails/:accountId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { accountId } = req.params;
    const result = await Email_1.Email.deleteMany({ accountId });
    return res.json({
        success: true,
        message: `Deleted ${result.deletedCount} emails for account ${accountId}`
    });
}));
router.get('/stats/:accountId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { accountId } = req.params;
    const stats = await Email_1.Email.aggregate([
        { $match: { accountId } },
        {
            $group: {
                _id: '$category',
                count: { $sum: 1 },
                avgConfidence: { $avg: '$categoryConfidence' }
            }
        }
    ]);
    const total = await Email_1.Email.countDocuments({ accountId });
    return res.json({
        success: true,
        data: {
            total,
            byCategory: stats,
            accountId
        }
    });
}));
exports.default = router;
//# sourceMappingURL=testRoutes.js.map