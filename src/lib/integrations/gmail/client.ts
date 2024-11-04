// src/lib/integrations/gmail/client.ts

import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { logger } from '../utils';
import { GmailTokens } from './types';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly'
];

export class GmailClient {
  private static instance: GmailClient | null = null;
  private oauth2Client;

  private constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_URL}/api/integrations/gmail/callback`
    );
  }

  public static getInstance(): GmailClient {
    if (!GmailClient.instance) {
      GmailClient.instance = new GmailClient();
    }
    return GmailClient.instance;
  }

  public async getTokens(code: string): Promise<GmailTokens> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      logger.info('Received Gmail tokens');
      
      if (!tokens.refresh_token) {
        throw new Error('No refresh token received');
      }

      return tokens as GmailTokens;
    } catch (error) {
      logger.error('Failed to get tokens', error);
      throw error;
    }
  }

  public async refreshTokens(refreshToken: string): Promise<GmailTokens> {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });
      
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials as GmailTokens;
    } catch (error) {
      logger.error('Failed to refresh tokens', error);
      throw error;
    }
  }

  public getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
  }

  public async setCredentials(tokens: GmailTokens): Promise<void> {
    this.oauth2Client.setCredentials(tokens);
  }

  private parseEmailAddress(email: string): { email: string; name?: string } {
    const match = email.match(/(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)/);
    return {
      email: match ? match[2] : email,
      name: match ? match[1] : undefined
    };
  }

  private async getEmailDetails(messageId: string): Promise<any> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
      metadataHeaders: ['From', 'Subject', 'Date']
    });

    const headers = message.data.payload?.headers || [];
    const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
    const fromHeader = headers.find(h => h.name === 'From')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || '';

    // Get message body
    let content = message.data.snippet || '';
    if (message.data.payload?.body?.data) {
      content = Buffer.from(message.data.payload.body.data, 'base64').toString();
    } else if (message.data.payload?.parts) {
      const textPart = message.data.payload.parts.find(part => part.mimeType === 'text/plain');
      if (textPart?.body?.data) {
        content = Buffer.from(textPart.body.data, 'base64').toString();
      }
    }

    const { email: fromEmail, name: fromName } = this.parseEmailAddress(fromHeader);

    return {
      id: message.data.id!,
      subject,
      from: fromEmail,
      fromName,
      date,
      content,
      threadId: message.data.threadId
    };
  }

  public async syncEmails(userId: string, maxResults: number = 50): Promise<{ new: number; total: number }> {
    try {
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'to:haloweaveinsights@gmail.com'
      });

      if (!response.data.messages) {
        return { new: 0, total: 0 };
      }

      let newCount = 0;
      const batchSize = 10;

      for (let i = 0; i < response.data.messages.length; i += batchSize) {
        const batch = response.data.messages.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (message) => {
          try {
            const existing = await prisma.communication.findUnique({
              where: {
                sourceId_userId: {
                  sourceId: message.id!,
                  userId
                }
              }
            });

            if (!existing) {
              const details = await this.getEmailDetails(message.id!);
              
              await prisma.communication.create({
                data: {
                  type: 'EMAIL',
                  sourceId: details.id,
                  direction: 'INBOUND',
                  subject: details.subject,
                  from: details.from,
                  content: details.content || details.snippet || '',
                  metadata: {
                    source: 'GMAIL',
                    date: details.date,
                    threadId: details.threadId,
                    fromName: details.fromName
                  },
                  status: 'PENDING',
                  userId
                }
              });

              newCount++;
            }
          } catch (error) {
            logger.error(`Failed to process email ${message.id}`, error);
          }
        }));
      }

      const total = await prisma.communication.count({
        where: {
          userId,
          type: 'EMAIL',
          metadata: {
            path: ['source'],
            equals: 'GMAIL'
          }
        }
      });

      return { new: newCount, total };
    } catch (error) {
      if ((error as any).message?.includes('invalid_grant')) {
        logger.error('Gmail token expired', error);
        throw new Error('Gmail token expired. Please reconnect your account.');
      }
      throw error;
    }
  }
}

export const gmailClient = GmailClient.getInstance();