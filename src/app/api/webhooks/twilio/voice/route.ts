import twilio from 'twilio';
import { logger } from '@/lib/integrations/utils';
const VoiceResponse = twilio.twiml.VoiceResponse;

const getWebhookUrl = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/webhooks/twilio/voice`;
  }
  return `${process.env.NEXT_PUBLIC_URL}/api/webhooks/twilio/voice`;
};

export async function POST(req: Request) {
  try {
    const body = await req.formData();
    const { CallSid, From, To } = Object.fromEntries(body.entries()) as any;

    logger.info('Voice webhook received', { CallSid, From, To });

    const twiml = new VoiceResponse();
    
    // Professional greeting
    twiml.say({
      voice: 'Polly.Amy-Neural',
      language: 'en-US'
    }, 'Thank you for calling Senate insights. Please leave your message after the tone.');
    
    // Set up recording with transcription
    twiml.record({
      action: `${getWebhookUrl()}/recording`,
      transcribe: true,
      transcribeCallback: `${getWebhookUrl()}/transcription`,
      recordingStatusCallback: `${getWebhookUrl()}/recording-status`,
      recordingStatusCallbackEvent: ['completed'],
      maxLength: 120,
      timeout: 5,
      playBeep: true
    });

    // Add goodbye message
    twiml.say({
      voice: 'Polly.Amy-Neural',
      language: 'en-US'
    }, 'Thank you for your message. We will review it and get back to you if needed.');

    return new Response(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
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