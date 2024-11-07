// src/app/api/webhooks/twilio/voice/route.ts

import twilio from 'twilio';
import { validateRequest } from 'twilio';
import { logger } from '@/lib/integrations/utils';
const VoiceResponse = twilio.twiml.VoiceResponse;

// Helper to get the base URL - accounts for both production and preview deployments
const getBaseUrl = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Fallback for local development
  return process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
};

export async function POST(req: Request) {
  try {
    // Validate Twilio signature
    const signature = req.headers.get('x-twilio-signature') || '';
    const webhookUrl = `${getBaseUrl()}/api/webhooks/twilio/voice`;
    
    const body = await req.formData();
    const params = Object.fromEntries(body.entries());
    
    // Validate the request
    const isValid = validateRequest(
      process.env.TWILIO_AUTH_TOKEN!,
      signature,
      webhookUrl,
      params as Record<string, string>
    );

    if (!isValid) {
      logger.error('Invalid Twilio signature', {
        url: webhookUrl,
        signature
      });
      return new Response('Invalid signature', { status: 403 });
    }

    const { CallSid, From, To } = params as any;
    logger.info('Voice webhook received', { CallSid, From, To });

    const twiml = new VoiceResponse();
    const baseUrl = getBaseUrl();
    
    // Professional greeting
    twiml.say({
      voice: 'Polly.Amy-Neural',
      language: 'en-US'
    }, 'Thank you for calling Senate insights. Please leave your message after the tone.');
    
    // Set up recording with webhooks
    twiml.record({
      // These URLs will be called by Twilio after recording
      action: `${baseUrl}/api/webhooks/twilio/voice/recording`,
      recordingStatusCallback: `${baseUrl}/api/webhooks/twilio/voice/recording-status`,
      transcribe: true,
      transcribeCallback: `${baseUrl}/api/webhooks/twilio/voice/transcription`,
      maxLength: 120,
      timeout: 5,
      playBeep: true,
      recordingStatusCallbackEvent: ['completed', 'failed']
    });

    // Add goodbye message
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