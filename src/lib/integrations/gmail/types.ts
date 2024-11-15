// src/lib/integrations/gmail/types.ts

import type { IntegrationTokens } from '../types';

export interface GmailTokens extends IntegrationTokens {
  refresh_token: string;
  expiry_date: number;
  scope: string;
}

export interface GmailMetadata {
  source: 'GMAIL';
  date: string;
  threadId: string;
  fromName?: string;
  syncedAt: string;
  lastSync?: string;
  labels?: string[];
}

export interface EmailDetails {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  fromName?: string;
  date: string;
  content: string;
  snippet?: string;
}

export interface SyncResult {
  new: number;
  total: number;
  error?: string;
}

export const validateGmailScope = (scope: string): boolean => {
  return scope.includes('https://www.googleapis.com/auth/gmail.readonly');
};