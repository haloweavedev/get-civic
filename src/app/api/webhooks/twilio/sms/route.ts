import { NextResponse } from 'next/server';
import { validateRequest } from 'twilio';
import { handleIncomingSMS } from '@/lib/integrations/twilio/handlers/sms';
import { TwilioSMSWebhookPayload } from '@/lib/integrations/twilio/types';

export async function POST(req: Request) {
  try {
    const body = await req.formData();
    const payload = Object.fromEntries(body.entries());
    const twilioSignature = req.headers.get('x-twilio-signature') || '';
    
    // Validate the request is from Twilio
    const url = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api/webhooks/twilio/sms`
      : 'http://localhost:3000/api/webhooks/twilio/sms';

    const isValid = validateRequest(
      process.env.TWILIO_AUTH_TOKEN!,
      twilioSignature,
      url,
      payload
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    const communication = await handleIncomingSMS(payload as unknown as TwilioSMSWebhookPayload);
    
    // Return empty TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response></Response>`;
    
    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (error) {
    console.error('SMS webhook error:', error);
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}