import { Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { Account } from '../models/Account';
import { logger } from '../utils/logger';
import { validateAccountData, isValidObjectId } from '../utils/validation';

class AccountController {
  getAccounts = asyncHandler(async (req: Request, res: Response) => {
    const { enabled, provider } = req.query;
    
    const filter: any = {};
    if (enabled !== undefined) filter.enabled = enabled === 'true';
    if (provider) filter.provider = provider;

    const accounts = await Account.find(filter)
      .select('-imapConfig.password') // Don't return passwords
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: accounts
    });
  });

  createAccount = asyncHandler(async (req: Request, res: Response) => {
    const accountData = req.body;
    
    // Validate account data
    const validation = validateAccountData(accountData);
    if (!validation.valid) {
      throw createError(validation.errors.join(', '), 400);
    }
    
    // Check if account already exists
    const existingAccount = await Account.findOne({ 
      accountId: accountData.accountId 
    });
    
    if (existingAccount) {
      throw createError('Account already exists', 409);
    }

    const account = new Account(accountData);
    await account.save();

    // Add to IMAP service if IMAP config provided and enabled
    if (accountData.imapConfig && account.enabled) {
      try {
        const { imapService } = await import('../services/imapService');
        await imapService.addAccount(account);
        logger.info(`Account added to IMAP service: ${account.accountId}`);
      } catch (error) {
        logger.warn(`Failed to add account to IMAP service: ${(error as Error).message}`);
        // Don't fail account creation if IMAP connection fails
      }
    }

    // Remove password from response
    const accountResponse = account.toObject();
    if (accountResponse.imapConfig) {
      const { password, ...imapConfigWithoutPassword } = accountResponse.imapConfig;
      accountResponse.imapConfig = imapConfigWithoutPassword as any;
    }

    logger.info(`New account created: ${account.accountId}`);

    res.status(201).json({
      success: true,
      data: accountResponse
    });
  });

  getAccountById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const account = await Account.findOne({ accountId: id })
      .select('-imapConfig.password');
      
    if (!account) {
      throw createError('Account not found', 404);
    }

    res.json({
      success: true,
      data: account
    });
  });

  updateAccount = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const account = await Account.findOneAndUpdate(
      { accountId: id },
      updates,
      { new: true, runValidators: true }
    ).select('-imapConfig.password');

    if (!account) {
      throw createError('Account not found', 404);
    }

    logger.info(`Account updated: ${id}`);

    res.json({
      success: true,
      data: account
    });
  });

  deleteAccount = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const account = await Account.findOneAndDelete({ accountId: id });
    
    if (!account) {
      throw createError('Account not found', 404);
    }

    // Remove from IMAP service if it was connected
    try {
      const { imapService } = await import('../services/imapService');
      await imapService.removeAccount(id);
      logger.info(`Account removed from IMAP service: ${id}`);
    } catch (error) {
      logger.warn(`Failed to remove account from IMAP service: ${(error as Error).message}`);
      // Don't fail deletion if IMAP removal fails
    }

    logger.info(`Account deleted: ${id}`);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  });

  testConnection = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const account = await Account.findOne({ accountId: id });
    if (!account) {
      throw createError('Account not found', 404);
    }

    // Import here to avoid circular dependency
    const { imapService } = await import('../services/imapService');
    
    try {
      await imapService.addAccount(account);
      logger.info(`Connection test successful for account: ${id}`);
      
      res.json({
        success: true,
        message: 'Connection test successful',
        data: { 
          accountId: id,
          status: imapService.getConnectionStatus(id)
        }
      });
    } catch (error) {
      throw createError(`Connection test failed: ${(error as Error).message}`, 400);
    }
  });

  toggleAccount = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { enabled } = req.body;

    const account = await Account.findOneAndUpdate(
      { accountId: id },
      { enabled },
      { new: true }
    ).select('-imapConfig.password');

    if (!account) {
      throw createError('Account not found', 404);
    }

    logger.info(`Account ${enabled ? 'enabled' : 'disabled'}: ${id}`);

    res.json({
      success: true,
      data: account
    });
  });
}

export const accountController = new AccountController();