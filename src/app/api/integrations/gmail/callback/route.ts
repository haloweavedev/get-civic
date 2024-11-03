import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { gmailClient } from '@/lib/integrations/gmail/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/integrations/utils';
import { IntegrationError } from '@/lib/integrations/errors';
import { validateGmailScope } from '@/lib/integrations/gmail/types';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new IntegrationError('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const searchParams = new URL(req.url).searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    if (error) {
      logger.error('Google OAuth error', { error });
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_URL}/dashboard/integrations/gmail?error=${error}`
      );
    }

    if (!code) {
      throw new IntegrationError('No authorization code', 'INVALID_REQUEST', 400);
    }

    // Get tokens from Google
    const tokens = await gmailClient.getTokens(code);
    logger.info('Received Gmail tokens', { userId, action: 'gmail_callback' });

    // Store tokens as parsed object, not string
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        settings: {
          gmailTokens: tokens  // Store directly as object
        }
      },
      create: {
        id: userId,
        email: '',
        settings: {
          gmailTokens: tokens  // Store directly as object
        }
      }
    });

    logger.info('Updated user settings', { userId: user.id });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/dashboard/integrations/gmail?success=true`
    );
  } catch (error) {
    logger.error('Gmail callback error', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/dashboard/integrations/gmail?error=${encodeURIComponent(error instanceof Error ? error.message : 'auth_failed')}`
    );
  }
}