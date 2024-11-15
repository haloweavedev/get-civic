// src/lib/integrations/utils.ts

export const logger = {
  info: (message: string, metadata?: any) => {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message,
        ...metadata,
      })
    );
  },

  error: (message: string, error: unknown, metadata?: any) => {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        message,
        error: error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : error,
        ...metadata,
      })
    );
  },

  warn: (message: string, metadata?: any) => {
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message,
        ...metadata,
      })
    );
  },

  debug: (message: string, metadata?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: 'debug',
          message,
          ...metadata,
        })
      );
    }
  }
};

export function parseEmailAddress(email: string): {
  email: string;
  name?: string;
} {
  if (!email) return { email: '' };
  
  const match = email.match(/(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)/);
  if (!match) return { email };
  
  return {
    name: match[1]?.trim(),
    email: match[2]?.trim() || email
  };
}

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}