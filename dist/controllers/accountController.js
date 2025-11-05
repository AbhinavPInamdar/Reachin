"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const Account_1 = require("../models/Account");
const logger_1 = require("../utils/logger");
const validation_1 = require("../utils/validation");
class AccountController {
    constructor() {
        this.getAccounts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { enabled, provider } = req.query;
            const filter = {};
            if (enabled !== undefined)
                filter.enabled = enabled === 'true';
            if (provider)
                filter.provider = provider;
            const accounts = await Account_1.Account.find(filter)
                .select('-imapConfig.password')
                .sort({ createdAt: -1 });
            res.json({
                success: true,
                data: accounts
            });
        });
        this.createAccount = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const accountData = req.body;
            const validation = (0, validation_1.validateAccountData)(accountData);
            if (!validation.valid) {
                throw (0, errorHandler_1.createError)(validation.errors.join(', '), 400);
            }
            const existingAccount = await Account_1.Account.findOne({
                accountId: accountData.accountId
            });
            if (existingAccount) {
                throw (0, errorHandler_1.createError)('Account already exists', 409);
            }
            const account = new Account_1.Account(accountData);
            await account.save();
            if (accountData.imapConfig && account.enabled) {
                try {
                    const { imapService } = await Promise.resolve().then(() => __importStar(require('../services/imapService')));
                    await imapService.addAccount(account);
                    logger_1.logger.info(`Account added to IMAP service: ${account.accountId}`);
                }
                catch (error) {
                    logger_1.logger.warn(`Failed to add account to IMAP service: ${error.message}`);
                }
            }
            const accountResponse = account.toObject();
            if (accountResponse.imapConfig) {
                const { password, ...imapConfigWithoutPassword } = accountResponse.imapConfig;
                accountResponse.imapConfig = imapConfigWithoutPassword;
            }
            logger_1.logger.info(`New account created: ${account.accountId}`);
            res.status(201).json({
                success: true,
                data: accountResponse
            });
        });
        this.getAccountById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const account = await Account_1.Account.findOne({ accountId: id })
                .select('-imapConfig.password');
            if (!account) {
                throw (0, errorHandler_1.createError)('Account not found', 404);
            }
            res.json({
                success: true,
                data: account
            });
        });
        this.updateAccount = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const updates = req.body;
            const account = await Account_1.Account.findOneAndUpdate({ accountId: id }, updates, { new: true, runValidators: true }).select('-imapConfig.password');
            if (!account) {
                throw (0, errorHandler_1.createError)('Account not found', 404);
            }
            logger_1.logger.info(`Account updated: ${id}`);
            res.json({
                success: true,
                data: account
            });
        });
        this.deleteAccount = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const account = await Account_1.Account.findOneAndDelete({ accountId: id });
            if (!account) {
                throw (0, errorHandler_1.createError)('Account not found', 404);
            }
            try {
                const { imapService } = await Promise.resolve().then(() => __importStar(require('../services/imapService')));
                await imapService.removeAccount(id);
                logger_1.logger.info(`Account removed from IMAP service: ${id}`);
            }
            catch (error) {
                logger_1.logger.warn(`Failed to remove account from IMAP service: ${error.message}`);
            }
            logger_1.logger.info(`Account deleted: ${id}`);
            res.json({
                success: true,
                message: 'Account deleted successfully'
            });
        });
        this.testConnection = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const account = await Account_1.Account.findOne({ accountId: id });
            if (!account) {
                throw (0, errorHandler_1.createError)('Account not found', 404);
            }
            const { imapService } = await Promise.resolve().then(() => __importStar(require('../services/imapService')));
            try {
                await imapService.addAccount(account);
                logger_1.logger.info(`Connection test successful for account: ${id}`);
                res.json({
                    success: true,
                    message: 'Connection test successful',
                    data: {
                        accountId: id,
                        status: imapService.getConnectionStatus(id)
                    }
                });
            }
            catch (error) {
                throw (0, errorHandler_1.createError)(`Connection test failed: ${error.message}`, 400);
            }
        });
        this.toggleAccount = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const { enabled } = req.body;
            const account = await Account_1.Account.findOneAndUpdate({ accountId: id }, { enabled }, { new: true }).select('-imapConfig.password');
            if (!account) {
                throw (0, errorHandler_1.createError)('Account not found', 404);
            }
            logger_1.logger.info(`Account ${enabled ? 'enabled' : 'disabled'}: ${id}`);
            res.json({
                success: true,
                data: account
            });
        });
    }
}
exports.accountController = new AccountController();
//# sourceMappingURL=accountController.js.map