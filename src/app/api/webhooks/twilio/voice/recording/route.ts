// src/app/api/webhooks/twilio/voice/recording/route.ts

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/integrations/utils';

export async function POST(req: Request) {
  try {
    const body = await req.formData();
    const payload = Object.fromEntries(body.entries());

    const {
      CallSid,
      RecordingSid,
      RecordingUrl,
      RecordingDuration,
      From,
      To,
    } = payload as any;

    logger.info('Recording completed', {
      CallSid,
      RecordingSid,
      RecordingUrl,
      RecordingDuration,
    });

    // Save the recording details to the database
    await prisma.communication.create({
      data: {
        type: 'CALL',
        direction: 'INBOUND',
        rawContent: RecordingUrl,
        metadata: {
          source: 'TWILIO',
          sourceId: CallSid,
          recordingSid: RecordingSid,
          recordingUrl: RecordingUrl,
          recordingDuration: RecordingDuration,
          from: From,
          to: To,
        },
        sourceId: CallSid,
        source: 'TWILIO',
        status: 'PROCESSING',
        participants: [From, To],
        userId: 'default-user-id', // Replace with actual user ID logic
      },
    });

    // Return empty TwiML response
    const twiml = `<Response></Response>`;
    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    logger.error('Error handling recording completion', error);
    return new Response('Error processing recording', { status: 500 });
  }
}