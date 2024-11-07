// src/app/api/webhooks/twilio/voice/route.ts

import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { validateRequest } from 'twilio';
import { logger } from '@/lib/integrations/utils';

const VoiceResponse = twilio.twiml.VoiceResponse;

// Helper to get the exact URL Twilio is calling
const getWebhookUrl = (req: Request) => {
  // Get the actual URL Twilio called
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}${url.pathname}`;
};

export async function POST(req: Request) {
  try {
    // Get the raw body data
    const body = await req.formData();
    const params = Object.fromEntries(body.entries());

    // Get Twilio signature from headers
    const twilioSignature = req.headers.get('x-twilio-signature') || '';
    
    // Get the exact URL that was called
    const webhookUrl = getWebhookUrl(req);

    logger.info('Processing voice webhook', {
      webhookUrl,
      twilioSignature,
      params: {
        CallSid: params.CallSid,
        From: params.From,
        To: params.To
      }
    });

    // Validate with the exact URL that was called
    const isValid = validateRequest(
      process.env.TWILIO_AUTH_TOKEN!,
      twilioSignature,
      webhookUrl,
      params as Record<string, string>
    );

    if (!isValid && process.env.NODE_ENV === 'production') {
      logger.error('Invalid Twilio signature', {
        webhookUrl,
        signature: twilioSignature,
        headers: Object.fromEntries(req.headers)
      });
      return new Response('Invalid signature', { status: 403 });
    }

    const twiml = new VoiceResponse();

    // Get the absolute base URL for callbacks
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://senate-insights.vercel.app';
    
    // Professional greeting
    twiml.say({
      voice: 'Polly.Amy-Neural',
      language: 'en-US'
    }, 'Thank you for calling Senate insights. Please leave your message after the tone.');
    
    // Set up recording
    twiml.record({
      action: `${baseUrl}/api/webhooks/twilio/voice/recording`,
      recordingStatusCallback: `${baseUrl}/api/webhooks/twilio/voice/recording-status`,
      transcribe: true,
      transcribeCallback: `${baseUrl}/api/webhooks/twilio/voice/transcription`,
      maxLength: 120,
      timeout: 5,
      playBeep: true,
      recordingStatusCallbackEvent: ['completed', 'failed']
    });

    twiml.say({
      voice: 'Polly.Amy-Neural',
      language: 'en-US'
    }, 'Thank you for your message. We will review it and get back to you if needed.');

    // Return proper TwiML response
    const response = new Response(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml'
      }
    });

    logger.info('Voice TwiML generated successfully', {
      CallSid: params.CallSid
    });

    return response;

  } catch (error) {
    logger.error('Voice webhook error:', error);
    const twiml = new VoiceResponse();
    twiml.say('We apologize, but we are unable to process your call at this time. Please try again later.');

    return new Response(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}