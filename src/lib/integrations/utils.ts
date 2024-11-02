import { IntegrationError } from './types';

// Logging utility
interface LogMetadata {
  source?: string;
  action?: string;
  userId?: string;
  details?: any;
}

export const logger = {
  info: (message: string, metadata?: LogMetadata) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message,
      ...metadata
    }));
  },
  
  error: (message: string, error: unknown, metadata?: LogMetadata) => {
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      message,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error instanceof IntegrationError && {
          code: error.code,
          status: error.status,
          details: error.details,
        }),
      } : error,
      ...metadata
    }));
  }
};

// Error handling utility
export async function handleIntegrationError(
  error: unknown,
  source: string,
  action: string
): Promise<IntegrationError> {
  let integrationError: IntegrationError;

  if (error instanceof IntegrationError) {
    integrationError = error;
  } else {
    integrationError = new IntegrationError(
      error instanceof Error ? error.message : 'Unknown integration error',
      'INTEGRATION_ERROR',
      500,
      error
    );
  }

  logger.error(
    `Integration error in ${source} during ${action}`,
    error,
    { source, action }
  );

  return integrationError;
}

// Rate limiting utility
export class RateLimiter {
  private cache: Map<string, { count: number; timestamp: number }> = new Map();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number = 60000 // 1 minute default
  ) {}

  async isAllowed(key: string): Promise<boolean> {
    const now = Date.now();
    const record = this.cache.get(key);

    if (!record) {
      this.cache.set(key, { count: 1, timestamp: now });
      return true;
    }

    if (now - record.timestamp > this.windowMs) {
      this.cache.set(key, { count: 1, timestamp: now });
      return true;
    }

    if (record.count >= this.limit) {
      return false;
    }

    record.count++;
    return true;
  }
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

// Retry utility with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  retries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === retries) throw error;
      
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      logger.info(`Retry attempt ${attempt} after ${delay}ms`, {
        action: 'retry',
        details: { attempt, maxRetries: retries, delay }
      });
    }
  }
  throw new Error('Retry failed');
}