import { prisma } from '@/lib/prisma';
import { TwilioSMSWebhookPayload } from '../types';

export async function handleIncomingSMS(payload: TwilioSMSWebhookPayload) {
  try {
    const communication = await prisma.communication.create({
      data: {
        type: 'SMS',
        direction: 'INBOUND',
        rawContent: payload.Body,
        metadata: payload,
        sourceId: payload.MessageSid,
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
    console.error('Error handling incoming SMS:', error);
    throw error;
  }
}