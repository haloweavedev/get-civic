// src/app/api/integrations/gmail/sync/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { gmailClient } from '@/lib/integrations/gmail/client';
import { logger } from '@/lib/integrations/utils';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Gmail tokens
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true }
    });

    if (!user?.settings || !(user.settings as any).gmailTokens) {
      return NextResponse.json(
        { error: 'Gmail not connected' },
        { status: 400 }
      );
    }

    // Set credentials and sync
    await gmailClient.setCredentials((user.settings as any).gmailTokens);
    const result = await gmailClient.syncEmails(userId);

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Email sync failed', error);
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    );
  }
}