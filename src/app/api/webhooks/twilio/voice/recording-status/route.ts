import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/integrations/utils';
import { AIAnalysisService } from '@/lib/services/ai-analysis';

export async function POST(req: Request) {
  try {
    const body = await req.formData();
    const {
      CallSid,
      TranscriptionSid,
      TranscriptionText,
      TranscriptionStatus,
      RecordingSid,
      From,
      To
    } = Object.fromEntries(body.entries()) as any;

    logger.info('Transcription received', {
      CallSid,
      TranscriptionSid,
      TranscriptionStatus
    });

    // Get admin user
    const user = await prisma.user.findFirst({
      where: { 
        email: 'haloweaveinsights@gmail.com',
        role: 'ADMIN'
      }
    });
    
    if (!user) {
      throw new Error('Admin user not found');
    }

    if (TranscriptionStatus === 'completed' && TranscriptionText) {
      // Update or create communication record
      const communication = await prisma.communication.upsert({
        where: {
          sourceId_userId: {
            sourceId: CallSid,
            userId: user.id
          }
        },
        create: {
          type: 'CALL',
          sourceId: CallSid,
          direction: 'INBOUND',
          subject: 'Voice Call Transcription',
          from: From,
          content: TranscriptionText,
          metadata: {
            source: 'TWILIO',
            to: To,
            transcriptionSid: TranscriptionSid,
            transcriptionStatus: TranscriptionStatus,
            recordingSid: RecordingSid,
            timestamp: new Date().toISOString()
          },
          status: 'PENDING',
          userId: user.id
        },
        update: {
          content: TranscriptionText,
          metadata: {
            transcriptionSid: TranscriptionSid,
            transcriptionStatus: TranscriptionStatus,
            transcribedAt: new Date().toISOString()
          },
          status: 'PENDING' // Reset to pending for AI analysis
        }
      });

      // Trigger AI analysis
      await AIAnalysisService.analyzeCommunication(communication.id);

      logger.info('Transcription processed and analyzed', {
        CallSid,
        communicationId: communication.id,
        userId: user.id
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Transcription webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process transcription' },
      { status: 500 }
    );
  }
}