import { NextResponse } from 'next/server';
import { gmailClient } from '@/lib/integrations/gmail/client';
import { prisma } from '@/lib/prisma';
import type { UserSettings } from '@/lib/integrations/gmail/types';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    console.log('Callback received:', { code, error });

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL('/dashboard/settings/email?error=' + encodeURIComponent(error), 
        process.env.NEXT_PUBLIC_URL!)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/dashboard/settings/email?error=no_code', 
        process.env.NEXT_PUBLIC_URL!)
      );
    }

    // Exchange code for tokens
    const tokens = await gmailClient.getTokens(code);
    console.log('Received tokens');
    
    // Save tokens securely
    const user = await prisma.user.upsert({
      where: { 
        email: 'haloweaveinsights@gmail.com'
      },
      update: {
        settings: {
          gmailTokens: tokens
        } as UserSettings
      },
      create: {
        email: 'haloweaveinsights@gmail.com',
        role: 'ADMIN',
        settings: {
          gmailTokens: tokens
        } as UserSettings
      }
    });

    console.log('Updated user');

    // Set up Gmail credentials
    await gmailClient.setCredentials(tokens);

    // Initial sync of recent emails
    const { syncRecentEmails } = await import('@/lib/integrations/gmail/handlers/email');
    await syncRecentEmails(50);

    return NextResponse.redirect(
      new URL('/dashboard/settings/email?success=true', 
      process.env.NEXT_PUBLIC_URL!)
    );
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings/email?error=internal_error', 
      process.env.NEXT_PUBLIC_URL!)
    );
  }
}