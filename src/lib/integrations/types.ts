export interface IntegrationTokens {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
    token_type: string;
    scope?: string;
  }
  
  export class IntegrationError extends Error {
    public code?: string;
    public status?: number;
    public details?: any;
  
    constructor(
      message: string,
      code?: string,
      status?: number,
      details?: any
    ) {
      super(message);
      this.name = 'IntegrationError';
      this.code = code;
      this.status = status;
      this.details = details;
    }
  }
  
  export type IntegrationSource = 'GMAIL' | 'TWILIO';
  
  export interface IntegrationMetadata {
    source: IntegrationSource;
    sourceId: string;
    direction: 'INBOUND' | 'OUTBOUND';
    participants: string[];
    timestamp: string;
    raw?: any;
  }
  
  export interface CommunicationProcessor {
    processIncoming(payload: any, userId?: string): Promise<any>;
    validateWebhook?(request: Request, url: string): Promise<boolean>;
  }
  
  // Additional types for Gmail and Twilio, if needed, can be defined here
  
  export type EmailMetadata = {
    id: string;
    threadId: string;
    subject: string;
    from: string;
    to: string;
    date: string;
    snippet: string;
    labels: string[];
  };
  
  export interface EmailContent {
    id: string;
    threadId: string;
    content: string;
    snippet: string;
    attachments: Array<{
      id: string;
      name: string;
      mimeType: string;
      size: number;
    }>;
  }  