// src/app/api/webhooks/twilio/voice/route.ts

import twilio from 'twilio';
import { logger } from '@/lib/integrations/utils';
import { prisma } from '@/lib/prisma';

const VoiceResponse = twilio.twiml.VoiceResponse;

// Helper to get the stable production URL
const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_URL || 'https://get-civic.vercel.app';
};

export async function POST(req: Request) {
  try {
    // Get the raw body data
    const body = await req.formData();
    const params = Object.fromEntries(body.entries());

    const url = new URL(req.url);
    const webhookUrl = `${url.protocol}//${url.host}${url.pathname}`;

    logger.info('Processing voice webhook', {
      webhookUrl,
      params: {
        CallSid: params.CallSid,
        From: params.From,
        To: params.To
      }
    });

    // Find or create user
    const user = await prisma.user.findFirst({
      where: { 
        email: '3advanceinsights@gmail.com',
        role: 'ADMIN'
      }
    });
    
    if (!user) {
      throw new Error('Admin user not found');
    }

    // Create initial communication record
    await prisma.communication.create({
      data: {
        type: 'CALL',
        sourceId: params.CallSid,
        direction: 'INBOUND',
        subject: 'Voice Call',
        from: params.From || '',
        content: '',
        metadata: {
          source: 'TWILIO',
          callStatus: params.CallStatus,
          timestamp: new Date().toISOString()
        },
        status: 'PENDING',
        userId: user.id
      }
    });

    const twiml = new VoiceResponse();
    const baseUrl = getBaseUrl();
    
    // Professional greeting
    twiml.say({
      voice: 'Polly.Amy-Neural',
      language: 'en-US'
    }, 'Hello there, you have reached Reprentative Smiths office. Please state your name and location, and let us know whats on your mind. We truly value your opinion and will respond as soon as possible.');
    
    // Set up recording
    twiml.record({
      transcribe: true,
      maxLength: 120,
      timeout: 5,
      playBeep: true,
      recordingStatusCallback: `${baseUrl}/api/webhooks/twilio/voice/recording-status`,
      transcribeCallback: `${baseUrl}/api/webhooks/twilio/voice/transcription`,
      recordingStatusCallbackEvent: ['completed', 'failed'],
      trim: 'trim-silence'
    });

    // Goodbye message
    twiml.say({
      voice: 'Polly.Amy-Neural',
      language: 'en-US'
    }, 'Thank you for your message. We will review it and get back to you if needed.');

    // Return TwiML response
    return new Response(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml'
      }
    });

  } catch (error) {
    logger.error('Voice webhook error:', error);
    const twiml = new VoiceResponse();
    twiml.say('We apologize, but we are unable to process your call at this time. Please try again later.');

    return new Response(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}