// src/app/api/webhooks/twilio/voice/transcription/route.ts

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/integrations/utils';

export async function POST(req: Request) {
  try {
    const body = await req.formData();
    const payload = Object.fromEntries(body.entries());

    const {
      CallSid,
      RecordingSid,
      TranscriptionText,
      From,
      To,
    } = payload as any;

    logger.info('Transcription received', {
      CallSid,
      RecordingSid,
      TranscriptionText,
    });

    // Update the communication record with the transcription
    await prisma.communication.updateMany({
      where: {
        sourceId: CallSid,
        'metadata.recordingSid': RecordingSid,
      },
      data: {
        processedContent: TranscriptionText,
        status: 'PROCESSED',
      },
    });

    // Run AI analysis on the transcript
    // (Assuming you have a function `runAIAnalysis`)
    await runAIAnalysis(CallSid, TranscriptionText);

    // Return empty TwiML response
    const twiml = `<Response></Response>`;
    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    logger.error('Error handling transcription', error);
    return new Response('Error processing transcription', { status: 500 });
  }
}

// Placeholder for AI analysis function
async function runAIAnalysis(callSid: string, transcript: string) {
  // Implement your AI analysis logic here
  logger.info('Running AI analysis', { callSid, transcript });
}