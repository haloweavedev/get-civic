// src/lib/integrations/utils.ts

import { IntegrationError } from './errors';

export const logger = {
  info: (message: string, metadata?: any) => {
    console.log(
      JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        message,
        ...metadata,
      })
    );
  },

  error: (message: string, error: unknown, metadata?: any) => {
    console.error(
      JSON.stringify({
        level: 'error',
        timestamp: new Date().toISOString(),
        message,
        error: error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
              ...(error instanceof IntegrationError && {
                code: error.code,
                status: error.status,
                details: error.details,
              }),
            }
          : error,
        ...metadata,
      })
    );
  },
};

export function handleIntegrationError(
  error: unknown,
  source?: string,
  action?: string
): IntegrationError {
  if (error instanceof IntegrationError) {
    return error;
  }

  const integrationError = new IntegrationError(
    error instanceof Error ? error.message : 'Unknown integration error',
    'INTEGRATION_ERROR',
    500,
    error
  );

  logger.error(
    `Integration error ${source ? `in ${source}` : ''} ${
      action ? `during ${action}` : ''
    }`,
    integrationError
  );

  return integrationError;
}

export function parseEmailAddress(email: string): {
  email: string;
  name?: string;
} {
  const match = email.match(/(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)/);
  if (!match) return { email };
  return {
    name: match[1],
    email: match[2],
  };
}