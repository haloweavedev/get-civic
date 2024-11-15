// src/lib/integrations/gmail/client.ts

import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { logger } from '../utils';
import { GmailTokens } from './types';
import { IntegrationError } from '../errors';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

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

  private async ensureValidToken(tokens: GmailTokens): Promise<GmailTokens> {
    const expiryDate = new Date(tokens.expiry_date);
    const isExpired = expiryDate <= new Date();

    if (isExpired && tokens.refresh_token) {
      logger.info('Token expired, refreshing...');
      try {
        this.oauth2Client.setCredentials(tokens);
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        return credentials as GmailTokens;
      } catch (error) {
        logger.error('Token refresh failed', error);
        throw new IntegrationError(
          'Failed to refresh Gmail token',
          'TOKEN_REFRESH_FAILED',
          401,
          error
        );
      }
    }
    return tokens;
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
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
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
      prompt: 'consent',
    });
  }

  public async setCredentials(tokens: GmailTokens): Promise<void> {
    this.oauth2Client.setCredentials(tokens);
  }

  public async syncEmails(
    userId: string,
    maxResults: number = 50
  ): Promise<{ new: number; total: number; error?: string }> {
    try {
      // Get user and tokens
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { settings: true },
      });

      const settings = user?.settings as any;
      const tokens = settings?.gmailTokens;

      if (!tokens) {
        throw new IntegrationError('No Gmail tokens found', 'NO_TOKENS', 401);
      }

      // Ensure token is valid
      const validTokens = await this.ensureValidToken(tokens);

      // Update tokens if refreshed
      if (validTokens !== tokens) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            settings: {
              ...settings,
              gmailTokens: validTokens,
            },
          },
        });
      }

      // Initialize Gmail API
      this.oauth2Client.setCredentials(validTokens);
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      // Fetch messages
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'to:haloweaveinsights@gmail.com',
      });

      if (!response.data.messages) {
        return { new: 0, total: 0 };
      }

      let newCount = 0;
      const batchSize = 10;
      const messages = response.data.messages;

      // Process in batches
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (message) => {
            try {
              // Check for existing message
              const existing = await prisma.communication.findFirst({
                where: {
                  sourceId: message.id!,
                  userId,
                  type: 'EMAIL',
                },
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
                      fromName: details.fromName,
                      syncedAt: new Date().toISOString(),
                    },
                    status: 'PENDING',
                    userId,
                  },
                });

                newCount++;
              }
            } catch (error) {
              logger.error(`Failed to process message ${message.id}`, error);
            }
          })
        );
      }

      // Get final count
      const total = await prisma.communication.count({
        where: {
          userId,
          type: 'EMAIL',
          metadata: {
            path: ['source'],
            equals: 'GMAIL',
          },
        },
      });

      return { new: newCount, total };
    } catch (error) {
      logger.error('Gmail sync failed', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { new: 0, total: 0, error: message };
    }
  }

  private async getEmailDetails(messageId: string): Promise<any> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const headers = message.data.payload?.headers || [];
    const subject = headers.find((h) => h.name === 'Subject')?.value || 'No Subject';
    const fromHeader = headers.find((h) => h.name === 'From')?.value || '';
    const date = headers.find((h) => h.name === 'Date')?.value || '';

    // Get message content
    let content = message.data.snippet || '';
    if (message.data.payload?.body?.data) {
      content = Buffer.from(message.data.payload.body.data, 'base64').toString();
    } else if (message.data.payload?.parts) {
      const textPart = message.data.payload.parts.find(
        (part) => part.mimeType === 'text/plain' || part.mimeType === 'text/html'
      );
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
      threadId: message.data.threadId,
      snippet: message.data.snippet,
    };
  }

  private parseEmailAddress(email: string): { email: string; name?: string } {
    const match = email.match(/(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)/);
    return {
      email: match ? match[2] : email,
      name: match ? match[1] : undefined,
    };
  }
}

export const gmailClient = GmailClient.getInstance();