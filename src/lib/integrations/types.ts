export interface IntegrationTokens {
    access_token: string;
    refresh_token?: string;
    expiry_date?: number;
    token_type: string;
    scope?: string;
  }
  
  export interface IntegrationError extends Error {
    code?: string;
    status?: number;
    details?: any;
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