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