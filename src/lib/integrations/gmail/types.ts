import type { IntegrationTokens } from '../types';

export interface GmailTokens extends IntegrationTokens {
  refresh_token: string;
  expiry_date: number;
  scope: string;
}

export interface EmailMetadata {
  id: string;
  threadId: string;
  subject: string;
  from: {
    email: string;
    name?: string;
  };
  to: {
    email: string;
    name?: string;
  };
  date: string;
  snippet: string;
  labels: string[];
}

export interface EmailContent {
  id: string;
  threadId: string;
  content: string;
  snippet?: string;
  attachments?: Array<{
    id: string;
    name: string;
    mimeType: string;
    size?: number;
  }>;
}

export const validateGmailScope = (scope: string): boolean => {
  return scope.includes('https://www.googleapis.com/auth/gmail.readonly');
};