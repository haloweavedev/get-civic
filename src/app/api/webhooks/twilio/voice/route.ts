import { NextResponse } from 'next/server';
import { validateRequest } from 'twilio';
import { handleIncomingCall } from '@/lib/integrations/twilio/handlers/call';
import { TwilioCallWebhookPayload } from '@/lib/integrations/twilio/types';

export async function POST(req: Request) {
  try {
    const body = await req.formData();
    const payload = Object.fromEntries(body.entries());
    const twilioSignature = req.headers.get('x-twilio-signature') || '';
    
    // Validate the request is from Twilio
    const url = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api/webhooks/twilio/voice`
      : 'http://localhost:3000/api/webhooks/twilio/voice';

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

    const communication = await handleIncomingCall(payload as unknown as TwilioCallWebhookPayload);
    
    // Return TwiML to record the call
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say>This call will be recorded for quality assurance.</Say>
        <Record transcribe="true" maxLength="3600"/>
      </Response>`;
    
    return new Response(twiml, {
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (error) {
    console.error('Voice webhook error:', error);
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}