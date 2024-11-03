// src/lib/integrations/gmail/client.ts
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { IntegrationError } from '../errors';
import { logger, handleIntegrationError, parseEmailAddress } from '../utils';
import { debugLog } from '@/lib/integrations/debug';
import type { GmailTokens, EmailMetadata, EmailContent } from './types';

const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly'
  ];

class GmailClient {
  private static instance: GmailClient | null = null;
  private oauth2Client;

  private constructor() {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_URL}/api/integrations/gmail/callback`;

    if (!clientId || !clientSecret) {
      throw new IntegrationError(
        'Missing Gmail credentials',
        'GMAIL_CONFIG_ERROR',
        500
      );
    }

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  public static getInstance(): GmailClient {
    if (!GmailClient.instance) {
      GmailClient.instance = new GmailClient();
    }
    return GmailClient.instance;
  }

public getAuthUrl(): string {
    try {
      return this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent' // Removed include_granted_scopes
      });
    } catch (error) {
      throw handleIntegrationError(error, 'Gmail', 'getAuthUrl');
    }
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
      throw handleIntegrationError(error, 'Gmail', 'getTokens');
    }
  }

  private async ensureValidToken(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      debugLog('ensureValidToken - User Data', { 
        userId,
        hasSettings: !!user?.settings,
        settingsContent: user?.settings 
      });
  
      if (!user?.settings) {
        throw new IntegrationError('User not found or no settings', 'USER_NOT_FOUND', 404);
      }
  
      const settings = user.settings as { gmailTokens?: string | GmailTokens };
      // Parse tokens if they're a string
      const tokens = typeof settings.gmailTokens === 'string' 
        ? JSON.parse(settings.gmailTokens) 
        : settings.gmailTokens;
  
      debugLog('ensureValidToken - Tokens', { 
        hasTokens: !!tokens,
        expiryDate: tokens?.expiry_date,
        currentTime: Date.now(),
        timeToExpiry: tokens?.expiry_date ? tokens.expiry_date - Date.now() : null,
        parsedTokens: tokens  // Log the parsed tokens
      });

      // Set credentials with the parsed tokens
      this.oauth2Client.setCredentials(tokens);
  
      if (!tokens.scope || !tokens.scope.includes('https://www.googleapis.com/auth/gmail.readonly')) {
        throw new IntegrationError(
          'Access token does not have the required scopes. Please reconnect your Gmail account.',
          'INSUFFICIENT_SCOPES',
          403
        );
      }
  
      // Check expiry and refresh if needed
      if (tokens.expiry_date && tokens.expiry_date < Date.now() + 5 * 60 * 1000) {
        debugLog('ensureValidToken - Refreshing Token', {
          reason: 'Token expired or expiring soon'
        });
        
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        
        await prisma.user.update({
          where: { id: userId },
          data: { 
            settings: { 
              ...user.settings, 
              gmailTokens: credentials  // Store as object
            } 
          }
        });
  
        this.oauth2Client.setCredentials(credentials);
        
        debugLog('ensureValidToken - Token Refreshed', {
          newExpiryDate: credentials.expiry_date
        });
      }
    } catch (error) {
      debugLog('ensureValidToken - Error', { error });
      throw handleIntegrationError(error, 'Gmail', 'ensureValidToken');
    }
  }

  public async testConnection(userId: string): Promise<{ connected: boolean; lastSync?: string }> {
    try {
      await this.ensureValidToken(userId);
      return { connected: true, lastSync: new Date().toISOString() };
    } catch (error) {
      logger.error('Gmail connection test failed', error);
      return { connected: false };
    }
  }

  public async listEmails(userId: string, maxResults: number = 10): Promise<EmailMetadata[]> {
    try {
      await this.ensureValidToken(userId);
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      
      // First, list all messages
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        // Remove the 'q' parameter from here and filter in memory
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
          const to = headers.find(h => h.name === 'To')?.value || '';
          
          // Filter here instead of in the API query
          if (!to.includes('haloweaveinsights@gmail.com')) {
            return null;
          }
  
          return {
            id: details.data.id!,
            threadId: details.data.threadId!,
            subject: headers.find(h => h.name === 'Subject')?.value || 'No Subject',
            from: parseEmailAddress(headers.find(h => h.name === 'From')?.value || ''),
            to: parseEmailAddress(to),
            date: headers.find(h => h.name === 'Date')?.value || new Date().toISOString(),
            snippet: details.data.snippet || '',
            labels: details.data.labelIds || []
          };
        })
      );
  
      // Filter out null values and limit to maxResults
      return emails.filter(Boolean).slice(0, maxResults);
    } catch (error) {
      throw handleIntegrationError(error, 'Gmail', 'listEmails');
    }
  }

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
        const extractText = (part: any): string => {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            return Buffer.from(part.body.data, 'base64').toString();
          }
          if (part.parts) {
            return part.parts.map((p: any) => extractText(p)).filter(Boolean).join('\n');
          }
          return '';
        };

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
      throw handleIntegrationError(error, 'Gmail', 'getEmailContent');
    }
  }
}

// Export the singleton instance
export const gmailClient = GmailClient.getInstance();