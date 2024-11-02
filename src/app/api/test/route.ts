import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { gmailClient } from '@/lib/integrations/gmail/client';
import { twilioClient } from '@/lib/integrations/twilio/client';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test Gmail Connection
    const gmailStatus = await gmailClient.testConnection(userId);
    
    // Test Twilio Connection
    const twilioStatus = await twilioClient.testConnection();

    return NextResponse.json({
      gmail: gmailStatus,
      twilio: twilioStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}