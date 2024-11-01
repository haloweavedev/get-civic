import { NextResponse } from 'next/server';
import { validateRequest } from 'twilio';
import { handleIncomingCall } from '@/lib/integrations/twilio/handlers/call';
import { TwilioCallWebhookPayload } from '@/lib/integrations/twilio/types';

export async function POST(req: Request) {
  try {
    // Get the request body and headers
    const body = await req.formData();
    const payload = Object.fromEntries(body.entries());
    const twilioSignature = req.headers.get('x-twilio-signature') || '';
    
    // Validate the request is from Twilio
    const url = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}/api/webhooks/twilio/voice`
      : 'http://localhost:3000/api/webhooks/twilio/voice';

    const isValid = validateRequest(
      twilioSignature,
      url,
      payload as Record<string, string>,
      process.env.TWILIO_AUTH_TOKEN!
    );

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    const communication = await handleIncomingCall(payload as TwilioCallWebhookPayload);
    
    return NextResponse.json({ success: true, id: communication.id });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}