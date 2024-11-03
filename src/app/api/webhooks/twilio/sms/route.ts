// src/app/api/webhooks/twilio/sms/route.ts

import { twilioProcessor } from '@/lib/integrations/twilio/handlers/processor';
import { logger, handleIntegrationError } from '@/lib/integrations/utils';
import type { TwilioSMSWebhookPayload } from '@/lib/integrations/twilio/types';
import { prisma } from '@/lib/prisma';

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
      return new Response('Invalid signature', { status: 403 });
    }

    // Process webhook payload
    const body = await req.formData();
    const payload = Object.fromEntries(body.entries()) as TwilioSMSWebhookPayload;

    logger.info('Processing SMS webhook', {
      source: 'TWILIO',
      action: 'process_sms',
      details: {
        from: payload.From,
        to: payload.To,
        body: payload.Body,
      },
    });

    // Save the SMS content to the database
    const communication = await prisma.communication.create({
      data: {
        type: 'SMS',
        direction: 'INBOUND',
        rawContent: payload.Body,
        processedContent: payload.Body,
        metadata: {
          source: 'TWILIO',
          sourceId: payload.MessageSid,
          from: payload.From,
          to: payload.To,
        },
        sourceId: payload.MessageSid,
        source: 'TWILIO',
        status: 'PROCESSED',
        participants: [payload.From, payload.To],
        userId: 'default-user-id', // Replace with actual user ID logic
      },
    });

    // Run AI analysis on the message body
    await runAIAnalysis(communication.id, payload.Body);

    // Optional: Send an automatic reply
    const twiml = `
      <Response>
        <Message>Your message has been received. Thank you!</Message>
      </Response>
    `;
    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    const integrationError = handleIntegrationError(error, 'TWILIO', 'sms_webhook');
    logger.error('Error processing SMS webhook', integrationError, {
      source: 'TWILIO',
      action: 'sms_webhook_error',
    });

    // Respond with an empty TwiML to Twilio
    const twiml = `<Response></Response>`;
    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}

// Placeholder for AI analysis function
async function runAIAnalysis(messageId: string, messageBody: string) {
  // Implement your AI analysis logic here
  logger.info('Running AI analysis on SMS', { messageId, messageBody });
}