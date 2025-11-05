"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const simpleController_1 = require("../controllers/simpleController");
const router = express_1.default.Router();
router.get('/emails', simpleController_1.SimpleController.getEmails);
router.post('/emails/search', simpleController_1.SimpleController.searchEmails);
router.post('/emails/:id/categorize', simpleController_1.SimpleController.categorizeEmail);
router.post('/ai/batch-categorize', simpleController_1.SimpleController.batchCategorize);
router.post('/notifications/test', simpleController_1.SimpleController.testNotification);
router.get('/notifications/config', simpleController_1.SimpleController.getNotificationConfig);
router.put('/notifications/config', simpleController_1.SimpleController.updateNotificationConfig);
router.post('/notifications/bulk', simpleController_1.SimpleController.sendBulkNotifications);
router.get('/stats', simpleController_1.SimpleController.getStats);
router.get('/emails/:id/reply-suggestions', simpleController_1.SimpleController.generateReplySuggestions);
router.get('/rag/contexts', simpleController_1.SimpleController.getRAGContexts);
router.post('/rag/contexts', simpleController_1.SimpleController.storeRAGContext);
router.post('/rag/test', simpleController_1.SimpleController.testRAGSystem);
exports.default = router;
//# sourceMappingURL=simpleRoutes.js.map