// src/app/api/webhooks/twilio/voice/transcription/route.ts
import { prisma } from '@/lib/prisma';
import { AIAnalysisService } from '@/lib/services/ai-analysis';

export async function POST(req: Request) {
  try {
    const user = await prisma.user.findFirst({
      where: { 
        email: 'haloweaveinsights@gmail.com',
        role: 'ADMIN'
      }
    });
    
    if (!user) {
      throw new Error('Admin user not found');
    }

    const body = await req.formData();
    const {
      TranscriptionText,
      CallSid,
      From
    } = Object.fromEntries(body.entries()) as any;

    // Store transcribed communication
    const communication = await prisma.communication.create({
      data: {
        type: 'CALL',
        sourceId: CallSid,
        direction: 'INBOUND',
        subject: 'Voice Call Transcript',
        from: From,
        content: TranscriptionText,
        metadata: {
          source: 'TWILIO',
          timestamp: new Date().toISOString()
        },
        status: 'PENDING',
        userId: user.id
      }
    });

    // Trigger analysis
    await AIAnalysisService.analyzeCommunication(communication.id);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Transcription webhook error:', error);
    return Response.json({ error: 'Failed to process transcription' }, { status: 500 });
  }
}