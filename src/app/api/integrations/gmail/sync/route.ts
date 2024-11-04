import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/integrations/utils';
import { syncEmailBatch } from '@/lib/integrations/gmail/processor';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Starting email sync', { userId });

    // Check if Gmail is connected
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user?.settings || !(user.settings as any).gmailTokens) {
      logger.error('Gmail not connected', { userId });
      return NextResponse.json(
        { error: 'Gmail not connected. Please connect Gmail first.' },
        { status: 400 }
      );
    }

    // Use the processor's syncEmailBatch function
    const { total, new: newCount } = await syncEmailBatch(userId);

    // Get accurate total count
    const totalEmails = await prisma.communication.count({
      where: {
        userId,
        source: 'GMAIL',
        type: 'EMAIL'
      }
    });

    logger.info('Sync completed', {
      userId,
      newEmails: newCount,
      totalEmails
    });

    return NextResponse.json({
      success: true,
      processed: newCount,
      total: totalEmails
    });
  } catch (error) {
    logger.error('Email sync failed', { error });
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}