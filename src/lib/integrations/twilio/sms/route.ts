// src/app/api/webhooks/twilio/sms/route.ts

import { NextResponse } from 'next/server';
import { twilioProcessor } from '@/lib/integrations/twilio/handlers/processor';
import { logger, handleIntegrationError } from '@/lib/integrations/utils';
import type { TwilioSMSWebhookPayload } from '@/lib/integrations/twilio/types';

export async function POST(req: Request) {
  logger.info('Received Twilio SMS webhook', { source: 'TWILIO', action: 'sms_webhook' });

  try {
    const url = `${process.env.NEXT_PUBLIC_URL}/api/webhooks/twilio/sms`;

    // Validate webhook
    const isValid = await twilioProcessor.validateWebhook(req.clone(), url);
    if (!isValid) {
      logger.error('Invalid Twilio signature', new Error('Signature validation failed'), {
        source: 'TWILIO',
        action: 'webhook_validation',
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    // Process webhook payload
    const body = await req.formData();
    const payload = Object.fromEntries(body.entries());

    logger.info('Processing SMS webhook', {
      source: 'TWILIO',
      action: 'process_sms',
      details: {
        from: payload.From,
        to: payload.To,
        hasMedia: payload.NumMedia !== '0',
      },
    });

    const communication = await twilioProcessor.processIncoming(
      payload as TwilioSMSWebhookPayload
    );

    return NextResponse.json({
      success: true,
      id: communication.id,
      status: communication.status,
    });
  } catch (error) {
    const integrationError = handleIntegrationError(error, 'TWILIO', 'sms_webhook');

    return NextResponse.json(
      {
        error: integrationError.message,
        code: integrationError.code,
        details: integrationError.details,
      },
      { status: integrationError.status || 500 }
    );
  }
}