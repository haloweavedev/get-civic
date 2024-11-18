import { NextResponse } from 'next/server';
import { gmailClient } from '@/lib/integrations/gmail/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/integrations/utils';
import { GmailTokens } from '@/lib/integrations/gmail/types';
import { syncEmailBatch } from '@/lib/integrations/gmail/processor';
import { IntegrationError } from '@/lib/integrations/errors';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    logger.info('Callback received', { code: !!code, error });

    if (error) {
      logger.error('OAuth error:', { error });
      return NextResponse.redirect(
        new URL('/dashboard/integrations/gmail?error=' + encodeURIComponent(error), 
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
    logger.info('Received Gmail tokens');
    
    // Save tokens securely
    const user = await prisma.user.upsert({
      where: { 
        email: '3advanceinsights@gmail.com'
      },
      update: {
        settings: {
          gmailTokens: tokens
        }
      },
      create: {
        email: '3advanceinsights@gmail.com',
        role: 'ADMIN',
        settings: {
          gmailTokens: tokens
        }
      }
    });

    logger.info('Updated user settings');

    // Set up Gmail credentials
    await gmailClient.setCredentials(tokens as GmailTokens);

    // Initial sync of recent emails
    await syncEmailBatch(user.id, 50);

    return NextResponse.redirect(
      new URL('/dashboard/integrations/gmail?success=true', 
      process.env.NEXT_PUBLIC_URL!)
    );
  } catch (error) {
    logger.error('Callback error:', error);
    const integrationError = error instanceof IntegrationError ? error : new IntegrationError(
      'Failed to process callback',
      'CALLBACK_ERROR',
      500,
      error
    );
    
    return NextResponse.redirect(
      new URL(
        `/dashboard/integrations/gmail?error=${encodeURIComponent(integrationError.message)}`,
        process.env.NEXT_PUBLIC_URL!
      )
    );
  }
}