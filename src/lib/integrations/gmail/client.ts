import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { IntegrationError, handleIntegrationError } from '../utils';
import type { GmailTokens, EmailMetadata, EmailContent } from './types';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.metadata'
];

export class GmailClient {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_URL}/api/integrations/gmail/callback`
    );
  }

  public getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      include_granted_scopes: true
    });
  }

  public async getTokens(code: string): Promise<GmailTokens> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      if (!tokens.refresh_token) {
        throw new IntegrationError(
          'No refresh token received',
          'GMAIL_NO_REFRESH_TOKEN',
          400
        );
      }
      return tokens as GmailTokens;
    } catch (error) {
      throw await handleIntegrationError(error);
    }
  }

  private async ensureValidToken(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ 
        where: { id: userId }
      });

      if (!user?.settings) {
        throw new IntegrationError(
          'User not found or no settings',
          'USER_NOT_FOUND',
          404
        );
      }

      const settings = user.settings as { gmailTokens?: GmailTokens };
      const tokens = settings.gmailTokens;
      
      if (!tokens) {
        throw new IntegrationError(
          'Gmail not connected',
          'GMAIL_NOT_CONNECTED',
          401
        );
      }

      // Refresh token if expired or about to expire (5 minutes buffer)
      if (tokens.expiry_date < Date.now() + 5 * 60 * 1000) {
        this.oauth2Client.setCredentials(tokens);
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        
        await prisma.user.update({
          where: { id: userId },
          data: {
            settings: {
              ...user.settings,
              gmailTokens: credentials
            }
          }
        });

        this.oauth2Client.setCredentials(credentials);
      } else {
        this.oauth2Client.setCredentials(tokens);
      }
    } catch (error) {
      throw await handleIntegrationError(error);
    }
  }

  public async listEmails(userId: string, maxResults: number = 10): Promise<EmailMetadata[]> {
    try {
      await this.ensureValidToken(userId);
      
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'to:haloweaveinsights@gmail.com'
      });

      if (!response.data.messages) return [];

      const emails = await Promise.all(
        response.data.messages.map(async (msg) => {
          const details = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'metadata',
            metadataHeaders: ['From', 'To', 'Subject', 'Date']
          });

          const headers = details.data.payload?.headers || [];
          return {
            id: details.data.id!,
            threadId: details.data.threadId!,
            subject: headers.find(h => h.name === 'Subject')?.value || 'No Subject',
            from: this.parseEmailAddress(headers.find(h => h.name === 'From')?.value || ''),
            to: this.parseEmailAddress(headers.find(h => h.name === 'To')?.value || ''),
            date: headers.find(h => h.name === 'Date')?.value || new Date().toISOString(),
            snippet: details.data.snippet || '',
            labels: details.data.labelIds || []
          };
        })
      );

      return emails;
    } catch (error) {
      throw await handleIntegrationError(error);
    }
  }

  private parseEmailAddress = parseEmailAddress;

  public async getEmailContent(userId: string, messageId: string): Promise<EmailContent> {
    try {
      await this.ensureValidToken(userId);
      
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      const message = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      let content = '';
      const attachments: EmailContent['attachments'] = [];

      if (message.data.payload) {
        // Extract text content
        const extractText = (part: any): string => {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            return Buffer.from(part.body.data, 'base64').toString();
          }

          if (part.parts) {
            return part.parts
              .map((p: any) => extractText(p))
              .filter(Boolean)
              .join('\n');
          }

          return '';
        };

        // Extract attachments info
        const processAttachments = (part: any) => {
          if (part.filename && part.body) {
            attachments.push({
              id: part.body.attachmentId || '',
              name: part.filename,
              mimeType: part.mimeType,
              size: part.body.size
            });
          }

          if (part.parts) {
            part.parts.forEach((p: any) => processAttachments(p));
          }
        };

        content = extractText(message.data.payload);
        processAttachments(message.data.payload);
      }

      return {
        id: message.data.id!,
        threadId: message.data.threadId!,
        content: content || message.data.snippet || '',
        snippet: message.data.snippet,
        attachments
      };
    } catch (error) {
      throw await handleIntegrationError(error);
    }
  }
}