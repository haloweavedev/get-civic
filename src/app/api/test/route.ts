// src/app/api/test/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { gmailClient } from '@/lib/integrations/gmail/client';
import { logger } from '@/lib/integrations/utils';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test Gmail Connection
    const gmailStatus = await gmailClient.testConnection(userId);

    // For now, return static Twilio status until we implement it
    const twilioStatus = {
      connected: false,
      message: 'Not implemented yet'
    };

    return NextResponse.json({
      gmail: gmailStatus,
      twilio: twilioStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Integration test failed', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}