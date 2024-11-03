// src/app/api/integrations/gmail/disconnect/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/integrations/utils';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user settings, preserving other settings
    await prisma.user.update({
      where: { id: userId },
      data: {
        settings: {
          ...user.settings,
          gmailTokens: null
        }
      }
    });

    logger.info('Gmail disconnected', { userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Gmail disconnect failed', error);
    return NextResponse.json(
      { error: 'Failed to disconnect', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}