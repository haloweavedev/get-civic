import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { IntegrationError } from '../errors';
import { logger } from '../utils';
import { debugLog } from '@/lib/integrations/debug';
import type { GmailTokens } from './types';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify'
];

class GmailClient {
  private static instance: GmailClient | null = null;
  private oauth2Client;
  private initialized = false;

  private getRedirectUri(): string {
    // For local development
    if (process.env.NODE_ENV === 'development') {
      const localUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
      return `${localUrl}/api/integrations/gmail/callback`;
    }
    
    // For production
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}/api/integrations/gmail/callback`;
    }
    
    // Fallback
    return `${process.env.NEXT_PUBLIC_URL}/api/integrations/gmail/callback`;
  }

  private constructor() {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    
    // Log configuration for debugging
    debugLog('Gmail Client Configuration', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      environment: process.env.NODE_ENV,
      redirectUri: this.getRedirectUri()
    });

    if (!clientId || !clientSecret) {
      logger.error('Gmail credentials missing', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        environment: process.env.NODE_ENV
      });

      throw new IntegrationError(
        'Gmail credentials missing. Please check your environment variables.',
        'GMAIL_CONFIG_ERROR',
        500
      );
    }

    try {
      this.oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        this.getRedirectUri()
      );
      
      this.initialized = true;

      logger.info('Gmail client initialized', { 
        redirectUri: this.getRedirectUri(),
        environment: process.env.NODE_ENV
      });
    } catch (error) {
      logger.error('Failed to initialize Gmail client', error);
      throw new IntegrationError(
        'Failed to initialize Gmail client',
        'GMAIL_INIT_ERROR',
        500,
        error
      );
    }
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
        prompt: 'consent',
        include_granted_scopes: true
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

  public async setCredentials(tokens: GmailTokens): Promise<void> {
    try {
      this.oauth2Client.setCredentials(tokens);
      logger.info('Gmail credentials set successfully');
    } catch (error) {
      throw handleIntegrationError(error, 'Gmail', 'setCredentials');
    }
  }

  private async ensureValidToken(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({ 
        where: { id: userId },
        select: { 
          id: true,
          email: true,
          settings: true
        }
      });

      debugLog('ensureValidToken - User Data', { 
        userId,
        hasSettings: !!user?.settings,
        environment: process.env.NODE_ENV
      });
  
      if (!user?.settings) {
        throw new IntegrationError('User not found or no settings', 'USER_NOT_FOUND', 404);
      }
  
      const settings = user.settings as { gmailTokens?: GmailTokens };
      const tokens = settings.gmailTokens;
  
      if (!tokens) {
        throw new IntegrationError('No Gmail tokens found', 'NO_TOKENS', 401);
      }

      this.oauth2Client.setCredentials(tokens);
  
      // Check token expiry
      if (tokens.expiry_date && tokens.expiry_date < Date.now() + 5 * 60 * 1000) {
        logger.info('Refreshing Gmail token', { userId });
        
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
        
        logger.info('Gmail token refreshed', { userId });
      }
    } catch (error) {
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