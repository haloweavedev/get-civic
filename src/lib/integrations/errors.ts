// src/lib/integrations/errors.ts
export class IntegrationError extends Error {
  constructor(message: string, public code: string, public status: number, public details?: any) {
    super(message);
    this.name = 'IntegrationError';
  }
}