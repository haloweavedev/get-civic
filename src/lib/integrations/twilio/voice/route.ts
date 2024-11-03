// src/app/api/webhooks/twilio/voice/route.ts

import { NextResponse } from 'next/server';
import { twilioProcessor } from '@/lib/integrations/twilio/handlers/processor';
import { logger, handleIntegrationError } from '@/lib/integrations/utils';
import type { TwilioCallWebhookPayload } from '@/lib/integrations/twilio/types';

export async function POST(req: Request) {
  logger.info('Received Twilio Voice webhook', { source: 'TWILIO', action: 'voice_webhook' });

  try {
    const url = `${process.env.NEXT_PUBLIC_URL}/api/webhooks/twilio/voice`;

    const isValid = await twilioProcessor.validateWebhook(req.clone(), url);
    if (!isValid) {
      logger.error('Invalid Twilio signature', new Error('Signature validation failed'), {
        source: 'TWILIO',
        action: 'webhook_validation',
      });
      return new Response('Invalid signature', { status: 403 });
    }

    // Parse the incoming payload
    const body = await req.formData();
    const payload = Object.fromEntries(body.entries()) as TwilioCallWebhookPayload;

    // Log incoming call details
    logger.info('Processing incoming call', {
      source: 'TWILIO',
      action: 'process_call',
      details: {
        from: payload.From,
        to: payload.To,
      },
    });

    // Generate TwiML to play message and record the call
    const twiml = `
      <Response>
        <Say>This call is recorded. Tell us about your concern.</Say>
        <Record
          maxLength="180"
          action="${process.env.NEXT_PUBLIC_URL}/api/webhooks/twilio/voice/recording"
          transcribe="true"
          transcribeCallback="${process.env.NEXT_PUBLIC_URL}/api/webhooks/twilio/voice/transcription"
        />
      </Response>
    `;

    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    const integrationError = handleIntegrationError(error, 'TWILIO', 'voice_webhook');
    logger.error('Error processing Voice webhook', integrationError, {
      source: 'TWILIO',
      action: 'voice_webhook_error',
    });

    const twiml = `
      <Response>
        <Say>We are experiencing technical difficulties. Please try again later.</Say>
      </Response>
    `;
    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}