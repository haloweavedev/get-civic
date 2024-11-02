import type { IntegrationMetadata } from '../types';

export interface TwilioCallWebhookPayload {
  CallSid: string;
  From: string;
  To: string;
  Direction: 'inbound' | 'outbound';
  CallStatus: string;
  RecordingUrl?: string;
  TranscriptionText?: string;
  Duration?: string;
}

export interface TwilioSMSWebhookPayload {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia: string;
  MediaUrl0?: string;
}

export interface TwilioMetadata extends IntegrationMetadata {
  source: 'TWILIO';
  mediaUrls?: string[];
  duration?: string;
  status: string;
}

export class TwilioError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'TwilioError';
  }
}