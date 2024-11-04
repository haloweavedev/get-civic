import { validateRequest } from 'twilio';
import { handleIncomingCall } from '@/lib/integrations/twilio/handlers/call';
import { TwilioCallWebhookPayload } from '@/lib/integrations/twilio/types';
import { logger } from '@/lib/integrations/utils';

const getWebhookUrl = () => {
  // Prioritize VERCEL_URL for production
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/webhooks/twilio/voice`;
  }
  // Use NEXT_PUBLIC_URL for development (ngrok)
  return `${process.env.NEXT_PUBLIC_URL}/api/webhooks/twilio/voice`;
};

export async function POST(req: Request) {
  try {
    logger.info('Received Twilio voice webhook', { 
      environment: process.env.NODE_ENV,
      webhookUrl: getWebhookUrl()
    });

    const body = await req.formData();
    const payload = Object.fromEntries(body.entries());
    const twilioSignature = req.headers.get('x-twilio-signature') || '';
    
    // Validate the request is from Twilio
    const webhookUrl = getWebhookUrl();
    
    const isValid = validateRequest(
      process.env.TWILIO_AUTH_TOKEN!,
      twilioSignature,
      webhookUrl,
      payload
    );

    if (!isValid) {
      logger.error('Invalid Twilio signature', {
        signature: twilioSignature,
        url: webhookUrl
      });
      
      return new Response('Invalid signature', { 
        status: 403,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const communication = await handleIncomingCall(payload as unknown as TwilioCallWebhookPayload);
    
    // Generate TwiML with dynamic webhook URLs
    const recordingWebhook = `${process.env.NEXT_PUBLIC_URL}/api/webhooks/twilio/voice/recording`;
    const transcriptionWebhook = `${process.env.NEXT_PUBLIC_URL}/api/webhooks/twilio/voice/transcription`;
    
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say>This call is being recorded for quality assurance. Please state your message after the beep.</Say>
        <Record
          action="${recordingWebhook}"
          transcribe="true"
          transcribeCallback="${transcriptionWebhook}"
          maxLength="300"
          timeout="5"
          playBeep="true"
        />
        <Say>Thank you for your message. Goodbye.</Say>
      </Response>`;
    
    logger.info('Successfully processed voice webhook', {
      communicationId: communication.id,
      recordingWebhook,
      transcriptionWebhook
    });

    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (error) {
    logger.error('Voice webhook error:', error);
    
    // Return a graceful TwiML response even in case of error
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say>We apologize, but we are unable to process your call at this time. Please try again later.</Say>
      </Response>`;

    return new Response(errorTwiml, {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}