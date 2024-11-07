// src/app/api/webhooks/twilio/voice/transcription/route.ts

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/integrations/utils';

export async function POST(req: Request) {
  try {
    const body = await req.formData();
    const {
      CallSid,
      RecordingSid,
      TranscriptionText,
      From
    } = Object.fromEntries(body.entries()) as any;

    logger.info('Transcription received', {
      CallSid,
      RecordingSid,
      from: From
    });

    // Find existing communication
    const communication = await prisma.communication.findFirst({
      where: {
        sourceId: CallSid,
        type: 'CALL'
      }
    });

    if (communication) {
      await prisma.communication.update({
        where: { id: communication.id },
        data: {
          content: TranscriptionText || '',
          metadata: {
            ...communication.metadata,
            transcriptionStatus: 'completed',
            transcribedAt: new Date().toISOString()
          },
          status: 'PROCESSED'
        }
      });

      logger.info('Updated transcription', {
        communicationId: communication.id,
        transcriptionLength: TranscriptionText?.length
      });
    }

    return new Response('', { status: 200 });
  } catch (error) {
    logger.error('Transcription webhook error:', error);
    return new Response('Error processing transcription', { status: 500 });
  }
}