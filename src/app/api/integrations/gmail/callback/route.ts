// src/app/api/integrations/gmail/callback/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { gmailClient } from '@/lib/integrations/gmail/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/integrations/utils';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.redirect(
        new URL('/sign-in', process.env.NEXT_PUBLIC_URL!)
      );
    }

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      logger.error('OAuth error:', { error });
      return NextResponse.redirect(
        new URL(`/dashboard/integrations/gmail?error=${error}`, 
        process.env.NEXT_PUBLIC_URL!)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/integrations/gmail?error=no_code', 
        process.env.NEXT_PUBLIC_URL!)
      );
    }

    // Exchange code for tokens
    const tokens = await gmailClient.getTokens(code);
    
    // Save tokens
    await prisma.user.update({
      where: { id: userId },
      data: {
        settings: {
          gmailTokens: tokens
        }
      }
    });

    // Initial setup with new tokens
    await gmailClient.setCredentials(tokens);
    
    // Sync initial batch of emails
    await gmailClient.syncEmails(userId, 10);

    return NextResponse.redirect(
      new URL('/dashboard/integrations/gmail?success=true', 
      process.env.NEXT_PUBLIC_URL!)
    );
  } catch (error) {
    logger.error('Callback error:', error);
    return NextResponse.redirect(
      new URL(
        `/dashboard/integrations/gmail?error=${encodeURIComponent(error.message)}`,
        process.env.NEXT_PUBLIC_URL!
      )
    );
  }
}