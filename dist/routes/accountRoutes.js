"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const accountController_1 = require("../controllers/accountController");
const router = express_1.default.Router();
router.get('/', accountController_1.accountController.getAccounts);
router.post('/', accountController_1.accountController.createAccount);
router.get('/:id', accountController_1.accountController.getAccountById);
router.put('/:id', accountController_1.accountController.updateAccount);
router.delete('/:id', accountController_1.accountController.deleteAccount);
router.post('/:id/test', accountController_1.accountController.testConnection);
router.put('/:id/enable', accountController_1.accountController.toggleAccount);
exports.default = router;
//# sourceMappingURL=accountRoutes.js.map