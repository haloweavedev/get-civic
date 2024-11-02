import { gmail_v1 } from 'googleapis';

export interface GmailOAuthTokens {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export interface UserSettings {
  gmailTokens?: GmailOAuthTokens;
  [key: string]: any;
}

export interface ParsedEmail {
  subject: string;
  from: string;
  to: string;
  body: string;
  date: string;
}

export type GmailMessage = gmail_v1.Schema$Message;
export type GmailHistory = gmail_v1.Schema$History;
export type GmailListMessagesResponse = gmail_v1.Schema$ListMessagesResponse;
export type GmailHistoryResponse = gmail_v1.Schema$ListHistoryResponse;