import { prisma } from '@/lib/prisma';
import { TwilioCallWebhookPayload } from '../types';

export async function handleIncomingCall(payload: TwilioCallWebhookPayload) {
  try {
    const communication = await prisma.communication.create({
      data: {
        type: 'CALL',
        direction: payload.Direction === 'inbound' ? 'INBOUND' : 'OUTBOUND',
        rawContent: payload.RecordingUrl || '',
        processedContent: payload.TranscriptionText,
        metadata: payload,
        sourceId: payload.CallSid,
        source: 'TWILIO',
        status: 'PENDING',
        participants: [payload.From, payload.To],
        // TODO: You'll need to implement logic to determine these
        organizationId: 'default-org-id',
        userId: 'default-user-id',
      },
    });

    return communication;
  } catch (error) {
    console.error('Error handling incoming call:', error);
    throw error;
  }
}