/**
 * Reusable validation utilities to eliminate duplicate validation logic
 */

/**
 * Validate MongoDB ObjectId format
 */
export function isValidObjectId(id: string): boolean {
  return !!(id && id.match(/^[0-9a-fA-F]{24}$/));
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate IMAP configuration
 */
export function validateImapConfig(config: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
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

/**
 * Validate account data
 */
export function validateAccountData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.accountId) {
    errors.push('Account ID is required');
  }

  if (!data.email) {
    errors.push('Email is required');
  } else if (!isValidEmail(data.email)) {
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

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Validate pagination parameters
 */
export function validatePagination(limit?: string, offset?: string): { limit: number; offset: number } {
  const parsedLimit = limit ? parseInt(limit) : 50;
  const parsedOffset = offset ? parseInt(offset) : 0;

  return {
    limit: Math.min(Math.max(parsedLimit, 1), 100), // Between 1 and 100
    offset: Math.max(parsedOffset, 0) // Non-negative
  };
}