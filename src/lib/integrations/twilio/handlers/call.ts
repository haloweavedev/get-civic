// src/lib/integrations/twilio/handlers/call.ts

import { prisma } from '@/lib/prisma';
import type { TwilioCallWebhookPayload } from '../types';
import { logger } from '@/lib/integrations/utils';

export async function handleIncomingCall(payload: TwilioCallWebhookPayload) {
  try {
    // Get admin user
    const user = await prisma.user.findFirst({
      where: { 
        email: '3advanceinsights@gmail.com',
        role: 'ADMIN'
      }
    });

    if (!user) {
      throw new Error('Admin user not found');
    }

    const communication = await prisma.communication.create({
      data: {
        type: 'CALL',
        sourceId: payload.CallSid,
        direction: 'INBOUND',
        subject: 'Voice Call',
        from: payload.From,
        content: payload.TranscriptionText || '',
        metadata: {
          source: 'TWILIO',
          to: payload.To,
          duration: payload.Duration,
          timestamp: new Date().toISOString(),
          recordingUrl: payload.RecordingUrl,
          recordingStatus: payload.CallStatus
        },
        status: 'PENDING',
        userId: user.id
      }
    });

    logger.info('Call record created', {
      communicationId: communication.id,
      callSid: payload.CallSid
    });

    return communication;
  } catch (error) {
    logger.error('Error handling incoming call:', error);
    throw error;
  }
}