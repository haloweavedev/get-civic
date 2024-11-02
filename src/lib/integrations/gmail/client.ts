import { google, gmail_v1 } from 'googleapis';
import type { GmailOAuthTokens } from './types';

const SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata'
];

export class GmailClient {
  private static instance: GmailClient;
  private oauth2Client;

  private constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_URL}/api/auth/callback`
    );
  }

  public static getInstance(): GmailClient {
    if (!GmailClient.instance) {
      GmailClient.instance = new GmailClient();
    }
    return GmailClient.instance;
  }

  public getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
  }

  public async getTokens(code: string): Promise<GmailOAuthTokens> {
    const { tokens } = await this.oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      throw new Error('No refresh token received');
    }
    return tokens as GmailOAuthTokens;
  }

  public async setCredentials(tokens: GmailOAuthTokens): Promise<void> {
    this.oauth2Client.setCredentials(tokens);
  }

  public getGmail() {
    return google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  public async listMessages(query: string = '', maxResults: number = 100) {
    const gmail = this.getGmail();
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: query
    });
    return response.data;
  }

  public async getMessage(messageId: string) {
    const gmail = this.getGmail();
    console.log('🔍 Fetching message metadata:', messageId);

    let metadataResponse;
    try {
      // Fetch metadata for the message
      metadataResponse = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'metadata',
        metadataHeaders: ['From', 'To', 'Subject', 'Date', 'Content-Type']
      });

      console.log('📨 Got metadata:', {
        id: messageId,
        hasPayload: !!metadataResponse.data.payload,
        mimeType: metadataResponse.data.payload?.mimeType
      });

      // Attempt to retrieve the full message content
      const fullResponse = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      console.log('📝 Got full message:', {
        id: messageId,
        hasParts: !!fullResponse.data.payload?.parts,
        bodySize: fullResponse.data.payload?.body?.size
      });

      let bodyContent = '';

      // Function to decode base64url content
      const decode = (data: string) => {
        try {
          return Buffer.from(data, 'base64url').toString('utf-8');
        } catch (error) {
          console.error('🚨 Decode error:', error);
          return '';
        }
      };

      if (fullResponse.data.payload) {
        const payload = fullResponse.data.payload;

        // Check for text/plain parts
        if (payload.parts) {
          const textPart = payload.parts.find((part: gmail_v1.Schema$MessagePart) => part.mimeType === 'text/plain');
          if (textPart?.body?.data) {
            bodyContent = decode(textPart.body.data);
          } else {
            // Extract all parts if no direct text part
            bodyContent = payload.parts
              .map((part: gmail_v1.Schema$MessagePart) => part.body?.data ? decode(part.body.data) : '')
              .filter(Boolean)
              .join('\n');
          }
        } else if (payload.body?.data) {
          // Handle cases where body data exists directly
          bodyContent = decode(payload.body.data);
        }
      }

      console.log('📄 Extracted content length:', bodyContent.length);

      return {
        ...fullResponse.data,
        decodedBody: bodyContent || fullResponse.data.snippet || ''
      };
    } catch (error) {
      console.error('❌ Error fetching full message:', error);

      if (!metadataResponse?.data) {
        throw error;
      }

      return {
        ...metadataResponse.data,
        decodedBody: metadataResponse.data.snippet || ''
      };
    }
  }

  private extractTextFromRaw(rawEmail: string): string {
    const parts = rawEmail.split('\n\n');
    if (parts.length < 2) return '';

    const headers = parts[0];
    const body = parts.slice(1).join('\n\n');

    const contentTypeMatch = headers.match(/Content-Type: (.+?)(?:;|$)/i);
    const contentType = contentTypeMatch ? contentTypeMatch[1].trim() : '';

    if (contentType.includes('multipart/alternative')) {
      const boundaryMatch = headers.match(/boundary="([^"]+)"/);
      if (!boundaryMatch) return body;

      const boundary = boundaryMatch[1];
      const parts = body.split('--' + boundary);

      for (const part of parts) {
        if (part.includes('Content-Type: text/plain')) {
          const content = part.split('\n\n').slice(1).join('\n\n');
          return content.trim();
        }
      }
    }

    return body.trim();
  }
}

export const gmailClient = GmailClient.getInstance();