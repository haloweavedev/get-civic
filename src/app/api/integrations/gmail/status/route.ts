import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/integrations/utils';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        settings: true,
      },
    });

    // Check Gmail connection status
    const settings = user?.settings as any;
    const connected = !!settings?.gmailTokens?.access_token;

    // Get email statistics
    const stats = connected ? await prisma.communication.aggregate({
      where: {
        userId,
        source: 'GMAIL',
        type: 'EMAIL'
      },
      _count: true,
      _max: {
        createdAt: true
      }
    }) : null;

    return NextResponse.json({
      connected,
      emailCount: stats?._count || 0,
      lastSync: stats?._max.createdAt || null
    });
  } catch (error) {
    logger.error('Failed to fetch Gmail status', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}