"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidObjectId = isValidObjectId;
exports.isValidEmail = isValidEmail;
exports.validateImapConfig = validateImapConfig;
exports.validateAccountData = validateAccountData;
exports.sanitizeString = sanitizeString;
exports.validatePagination = validatePagination;
function isValidObjectId(id) {
    return !!(id && id.match(/^[0-9a-fA-F]{24}$/));
}
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function validateImapConfig(config) {
    const errors = [];
    if (!config) {
        errors.push('IMAP configuration is required');
        return { valid: false, errors };
    }
    const requiredFields = ['host', 'port', 'username', 'password'];
    for (const field of requiredFields) {
        if (!config[field]) {
            errors.push(`IMAP ${field} is required`);
        }
    }
    if (config.port && (isNaN(config.port) || config.port < 1 || config.port > 65535)) {
        errors.push('IMAP port must be a valid number between 1 and 65535');
    }
    return { valid: errors.length === 0, errors };
}
function validateAccountData(data) {
    const errors = [];
    if (!data.accountId) {
        errors.push('Account ID is required');
    }
    if (!data.email) {
        errors.push('Email is required');
    }
    else if (!isValidEmail(data.email)) {
        errors.push('Invalid email format');
    }
    if (!data.provider) {
        errors.push('Provider is required');
    }
    if (data.imapConfig) {
        const imapValidation = validateImapConfig(data.imapConfig);
        if (!imapValidation.valid) {
            errors.push(...imapValidation.errors);
        }
    }
    return { valid: errors.length === 0, errors };
}
function sanitizeString(input) {
    if (typeof input !== 'string')
        return '';
    return input.trim().replace(/[<>]/g, '');
}
function validatePagination(limit, offset) {
    const parsedLimit = limit ? parseInt(limit) : 50;
    const parsedOffset = offset ? parseInt(offset) : 0;
    return {
        limit: Math.min(Math.max(parsedLimit, 1), 100),
        offset: Math.max(parsedOffset, 0)
    };
}
//# sourceMappingURL=validation.js.map