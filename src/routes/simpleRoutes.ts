import express from 'express';
import { SimpleController } from '../controllers/simpleController';

const router = express.Router();

router.get('/emails', SimpleController.getEmails);
router.post('/emails/search', SimpleController.searchEmails);
router.post('/emails/:id/categorize', SimpleController.categorizeEmail);

router.post('/ai/batch-categorize', SimpleController.batchCategorize);

router.post('/notifications/test', SimpleController.testNotification);
router.get('/notifications/config', SimpleController.getNotificationConfig);
router.put('/notifications/config', SimpleController.updateNotificationConfig);
router.post('/notifications/bulk', SimpleController.sendBulkNotifications);

router.get('/stats', SimpleController.getStats);

router.get('/emails/:id/reply-suggestions', SimpleController.generateReplySuggestions);
router.get('/rag/contexts', SimpleController.getRAGContexts);
router.post('/rag/contexts', SimpleController.storeRAGContext);
router.post('/rag/test', SimpleController.testRAGSystem);

export default router;