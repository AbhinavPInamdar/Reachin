import express from 'express';
import { accountController } from '../controllers/accountController';

const router = express.Router();

router.get('/', accountController.getAccounts);

router.post('/', accountController.createAccount);

router.get('/:id', accountController.getAccountById);

router.put('/:id', accountController.updateAccount);

router.delete('/:id', accountController.deleteAccount);

router.post('/:id/test', accountController.testConnection);

router.put('/:id/enable', accountController.toggleAccount);

export default router;