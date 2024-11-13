// src/app/api/webhooks/twilio/voice/transcription/route.ts

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/integrations/utils';
import { AIAnalysisService } from '@/lib/services/ai-analysis';

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

    // Log the received transcription and metadata
    console.log('Transcription received:', {
      CallSid,
      RecordingSid,
      TranscriptionText,
      metadata: communication?.metadata // After DB query
    });

    if (communication) {
      // Update communication with the transcription
      await prisma.communication.update({
        where: { id: communication.id },
        data: {
          content: TranscriptionText || '',
          metadata: {
            ...(typeof communication.metadata === 'object' ? communication.metadata : {}),
            transcriptionStatus: 'completed',
            transcribedAt: new Date().toISOString()
          },
          status: 'PROCESSED'
        }
      });

      // Trigger AI analysis
      await AIAnalysisService.analyzeCommunication(communication.id);

      logger.info('Analysis completed', {
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