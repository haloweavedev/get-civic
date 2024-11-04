// src/app/api/auth/sync/route.ts

import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/integrations/utils';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Clerk user data
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    logger.info('Syncing user', {
      userId,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      action: 'user_sync_start'
    });

    // Get or create user
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
      },
      create: {
        id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        role: 'USER',
        settings: {}
      }
    });

    logger.info('User synced', {
      userId: user.id,
      email: user.email,
      action: 'user_sync_success'
    });

    // Handle redirect if present
    const url = new URL(request.url);
    const redirectUrl = url.searchParams.get('redirect');
    if (redirectUrl) {
      return NextResponse.redirect(new URL(redirectUrl, process.env.NEXT_PUBLIC_URL!));
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    logger.error('User sync failed', error);
    return NextResponse.json(
      { 
        error: 'Sync failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}