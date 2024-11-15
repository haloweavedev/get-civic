// src/lib/integrations/errors.ts

export class IntegrationError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'IntegrationError';

    // Ensure stack trace captures the error
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, IntegrationError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      details: this.details,
      stack: this.stack
    };
  }
}

export const ERROR_CODES = {
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED',
  API_ERROR: 'API_ERROR',
  SYNC_FAILED: 'SYNC_FAILED',
  PROCESSING_FAILED: 'PROCESSING_FAILED',
  RATE_LIMIT: 'RATE_LIMIT'
} as const;