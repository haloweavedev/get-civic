// src/app/api/integrations/gmail/auth/route.ts
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

    logger.info('Starting Gmail auth', { userId });

    const authUrl = gmailClient.getAuthUrl();
    logger.info('Generated auth URL', { authUrl });

    return NextResponse.json({ authUrl });
  } catch (error) {
    logger.error('Gmail auth error', error);
    return NextResponse.json(
      { error: 'Failed to start Gmail auth' },
      { status: 500 }
    );
  }
}