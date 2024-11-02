import { prisma } from '@/lib/prisma';
import { validateRequest } from 'twilio';
import type { TwilioCallWebhookPayload, TwilioSMSWebhookPayload, TwilioMetadata } from '../types';
import { TwilioError } from '../types';
import type { CommunicationProcessor } from '../../types';

export class TwilioProcessor implements CommunicationProcessor {
  async validateWebhook(request: Request, url: string): Promise<boolean> {
    try {
      const body = await request.formData();
      const payload = Object.fromEntries(body.entries());
      const twilioSignature = request.headers.get('x-twilio-signature') || '';

      return validateRequest(
        twilioSignature,
        url,
        payload as Record<string, string>,
        process.env.TWILIO_AUTH_TOKEN!
      );
    } catch (error) {
      throw new TwilioError(
        'Failed to validate webhook',
        'WEBHOOK_VALIDATION_FAILED',
        403,
        error
      );
    }
  }

  async processIncoming(
    payload: TwilioCallWebhookPayload | TwilioSMSWebhookPayload,
    userId: string = 'default-user-id'
  ) {
    try {
      const isCall = 'CallSid' in payload;
      const metadata: TwilioMetadata = {
        source: 'TWILIO',
        sourceId: isCall ? payload.CallSid : (payload as TwilioSMSWebhookPayload).MessageSid,
        direction: payload.Direction === 'inbound' ? 'INBOUND' : 'OUTBOUND',
        participants: [payload.From, payload.To],
        timestamp: new Date().toISOString(),
        status: isCall ? (payload as TwilioCallWebhookPayload).CallStatus : 'received',
        ...(isCall && {
          duration: (payload as TwilioCallWebhookPayload).Duration,
          mediaUrls: (payload as TwilioCallWebhookPayload).RecordingUrl ? 
            [(payload as TwilioCallWebhookPayload).RecordingUrl] : 
            undefined
        }),
        ...(!isCall && {
          mediaUrls: (payload as TwilioSMSWebhookPayload).MediaUrl0 ? 
            [(payload as TwilioSMSWebhookPayload).MediaUrl0] : 
            undefined
        }),
        raw: payload
      };

      const communication = await prisma.communication.create({
        data: {
          type: isCall ? 'CALL' : 'SMS',
          direction: metadata.direction,
          rawContent: isCall ? 
            (payload as TwilioCallWebhookPayload).RecordingUrl || '' : 
            (payload as TwilioSMSWebhookPayload).Body,
          processedContent: isCall ? 
            (payload as TwilioCallWebhookPayload).TranscriptionText || '' : 
            (payload as TwilioSMSWebhookPayload).Body,
          metadata,
          sourceId: metadata.sourceId,
          source: 'TWILIO',
          status: 'PENDING',
          participants: metadata.participants,
          organizationId: 'default-org',
          userId
        },
      });

      return communication;
    } catch (error) {
      throw new TwilioError(
        'Failed to process communication',
        'PROCESSING_FAILED',
        500,
        error
      );
    }
  }
}

export const twilioProcessor = new TwilioProcessor();