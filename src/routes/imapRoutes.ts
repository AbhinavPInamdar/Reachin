import { Router, Request, Response } from 'express';
import { imapService } from '../services/imapService';
import { Account } from '../models/Account';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();

router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  const statuses = await imapService.getAllConnectionStatuses();
  
  return res.json({
    success: true,
    data: statuses
  });
}));

router.get('/status/:accountId', asyncHandler(async (req: Request, res: Response) => {
  const { accountId } = req.params;
  const status = imapService.getConnectionStatus(accountId);
  
  return res.json({
    success: true,
    data: { accountId, ...status }
  });
}));

router.post('/sync/:accountId', asyncHandler(async (req: Request, res: Response) => {
  const { accountId } = req.params;
  
  await imapService.syncAccount(accountId);
  
  return res.json({
    success: true,
    message: `Account ${accountId} synced successfully`
  });
}));


router.post('/start-all', asyncHandler(async (req: Request, res: Response) => {
  await imapService.startAllConnections();
  
  return res.json({
    success: true,
    message: 'All IMAP connections started'
  });
}));

router.post('/stop-all', asyncHandler(async (req: Request, res: Response) => {
  await imapService.stopAllConnections();
  
  return res.json({
    success: true,
    message: 'All IMAP connections stopped'
  });
}));

router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const statuses = await imapService.getAllConnectionStatuses();
  const totalAccounts = Object.keys(statuses).length;
  const connectedAccounts = Object.values(statuses).filter(
    (status: any) => status.status === 'connected'
  ).length;
  
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

export default router;