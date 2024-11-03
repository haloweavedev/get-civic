// src/app/api/communications/test-call/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { twilioClient } from '@/lib/integrations/twilio/client';
import { logger } from '@/lib/integrations/utils';

export async function POST(req: Request) {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { phoneNumber } = await req.json();
    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Log the attempt
    logger.info('Initiating test call', { userId, phoneNumber });

    // Get Twilio client
    const client = twilioClient.getClient();

    // Create the call
    const call = await client.calls.create({
      url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/twilio/voice`,
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER!,
    });

    // Log success
    logger.info('Test call initiated', { 
      userId, 
      callSid: call.sid,
      status: call.status 
    });

    return NextResponse.json({
      success: true,
      callSid: call.sid,
    });
  } catch (error) {
    // Log error
    logger.error('Test call failed', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate call',
      },
      { status: 500 }
    );
  }
}