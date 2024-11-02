import { NextResponse } from 'next/server';
import { gmailClient } from '@/lib/integrations/gmail/client';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authUrl = gmailClient.getAuthUrl();
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('Auth URL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}