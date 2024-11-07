// src/app/api/webhooks/twilio/voice/recording-status/route.ts

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/integrations/utils';

export async function POST(req: Request) {
  try {
    const body = await req.formData();
    const params = Object.fromEntries(body.entries());

    const {
      CallSid,
      RecordingSid,
      RecordingUrl,
      RecordingStatus,
      RecordingDuration,
      RecordingChannels,
      RecordingSource
    } = params as any;

    logger.info('Recording status update received', {
      CallSid,
      RecordingSid,
      RecordingStatus,
      duration: RecordingDuration
    });

    // Find existing communication
    const communication = await prisma.communication.findFirst({
      where: {
        sourceId: CallSid,
        type: 'CALL'
      }
    });

    if (communication) {
      // Update with recording metadata
      await prisma.communication.update({
        where: { id: communication.id },
        data: {
          metadata: {
            ...communication.metadata,
            recordingSid: RecordingSid,
            recordingUrl: RecordingUrl,
            recordingStatus: RecordingStatus,
            recordingDuration: RecordingDuration,
            recordingChannels: RecordingChannels,
            recordingSource: RecordingSource,
            updatedAt: new Date().toISOString()
          },
          status: RecordingStatus === 'completed' ? 'PROCESSING' : 'PENDING'
        }
      });

      logger.info('Updated communication record', {
        communicationId: communication.id,
        recordingStatus: RecordingStatus
      });
    }

    return new Response('', { status: 200 });
  } catch (error) {
    logger.error('Recording status webhook error:', error);
    return new Response('Error processing recording status', { status: 500 });
  }
}