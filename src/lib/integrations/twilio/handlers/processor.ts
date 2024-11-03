// src/lib/integrations/twilio/handlers/processor.ts

import { prisma } from '@/lib/prisma';
import { validateRequest } from 'twilio';
import type { TwilioCallWebhookPayload, TwilioSMSWebhookPayload, TwilioMetadata } from '../types';
import { TwilioError } from '../types';
import type { CommunicationProcessor } from '@/lib/integrations/types';

export class TwilioProcessor implements CommunicationProcessor {
  async validateWebhook(request: Request, url: string): Promise<boolean> {
    try {
      const body = await request.formData();
      const payload = Object.fromEntries(body.entries());
      const twilioSignature = request.headers.get('x-twilio-signature') || '';

      return validateRequest(
        process.env.TWILIO_AUTH_TOKEN!,
        twilioSignature,
        url,
        payload as Record<string, string>
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
        sourceId: isCall ? payload.CallSid : payload.MessageSid,
        direction: payload.Direction === 'inbound' ? 'INBOUND' : 'OUTBOUND',
        participants: [payload.From, payload.To],
        timestamp: new Date().toISOString(),
        status: isCall ? payload.CallStatus : 'received',
        ...(isCall && {
          duration: payload.Duration,
          mediaUrls: payload.RecordingUrl ? [payload.RecordingUrl] : undefined,
        }),
        ...(!isCall && {
          mediaUrls: payload.NumMedia !== '0' ? [payload.MediaUrl0!] : undefined,
        }),
        raw: payload,
      };

      const communication = await prisma.communication.create({
        data: {
          type: isCall ? 'CALL' : 'SMS',
          direction: metadata.direction,
          rawContent: isCall
            ? payload.RecordingUrl || ''
            : payload.Body,
          processedContent: isCall
            ? payload.TranscriptionText || ''
            : payload.Body,
          metadata,
          sourceId: metadata.sourceId,
          source: 'TWILIO',
          status: 'PENDING',
          participants: metadata.participants,
          organizationId: 'default-org',
          userId,
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