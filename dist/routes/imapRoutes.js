"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const imapService_1 = require("../services/imapService");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
router.get('/status', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const statuses = await imapService_1.imapService.getAllConnectionStatuses();
    return res.json({
        success: true,
        data: statuses
    });
}));
router.get('/status/:accountId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { accountId } = req.params;
    const status = imapService_1.imapService.getConnectionStatus(accountId);
    return res.json({
        success: true,
        data: { accountId, ...status }
    });
}));
router.post('/sync/:accountId', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { accountId } = req.params;
    await imapService_1.imapService.syncAccount(accountId);
    return res.json({
        success: true,
        message: `Account ${accountId} synced successfully`
    });
}));
router.post('/start-all', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await imapService_1.imapService.startAllConnections();
    return res.json({
        success: true,
        message: 'All IMAP connections started'
    });
}));
router.post('/stop-all', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    await imapService_1.imapService.stopAllConnections();
    return res.json({
        success: true,
        message: 'All IMAP connections stopped'
    });
}));
router.get('/health', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const statuses = await imapService_1.imapService.getAllConnectionStatuses();
    const totalAccounts = Object.keys(statuses).length;
    const connectedAccounts = Object.values(statuses).filter((status) => status.status === 'connected').length;
    return res.json({
        success: true,
        data: {
            totalAccounts,
            connectedAccounts,
            disconnectedAccounts: totalAccounts - connectedAccounts,
            health: connectedAccounts > 0 ? 'healthy' : 'unhealthy',
            statuses
        }
    });
}));
exports.default = router;
//# sourceMappingURL=imapRoutes.js.map