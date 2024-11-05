// src/app/api/webhooks/twilio/voice/route.ts
import twilio from 'twilio';
import { prisma } from '@/lib/prisma';
const VoiceResponse = twilio.twiml.VoiceResponse;

const getWebhookUrl = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api/webhooks/twilio/voice`;
  }
  return `${process.env.NEXT_PUBLIC_URL}/api/webhooks/twilio/voice`;
};

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

    const twiml = new VoiceResponse();
    
    // Add greeting
    twiml.say('Thanks for calling Senate insights. Please leave your message after the tone.');
    
    // Set up recording with transcription
    twiml.record({
      action: `${getWebhookUrl()}/recording`,
      transcribe: true,
      transcribeCallback: `${getWebhookUrl()}/transcription`,
      maxLength: 120,
      timeout: 5,
      playBeep: true
    });

    return new Response(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (error) {
    console.error('Voice webhook error:', error);
    const twiml = new VoiceResponse();
    twiml.say('We apologize, but we are unable to process your call at this time. Please try again later.');

    return new Response(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml' }
    });
  }
}