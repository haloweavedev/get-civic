// src/app/api/webhooks/twilio/sms/route.ts
import { NextResponse } from 'next/server';
import { twilioProcessor } from '@/lib/integrations/twilio/handlers/processor';
import { logger } from '@/lib/integrations/utils';
import { TwilioSMSWebhookPayload } from '@/lib/integrations/twilio/types';

const getWebhookUrl = () => {
  return process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}/api/webhooks/twilio/sms`
    : `${process.env.NEXT_PUBLIC_URL}/api/webhooks/twilio/sms`;
};

export async function POST(req: Request) {
  try {
    const webhookUrl = getWebhookUrl();
    logger.info('Received SMS webhook', { 
      environment: process.env.NODE_ENV,
      webhookUrl 
    });

    // Validate webhook signature
    const isValid = await twilioProcessor.validateWebhook(req.clone(), webhookUrl);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
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