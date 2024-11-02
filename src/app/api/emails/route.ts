import { NextResponse } from 'next/server';
import { syncRecentEmails } from '@/lib/integrations/gmail/handlers/email';
import { prisma } from '@/lib/prisma';
import { gmailClient } from '@/lib/integrations/gmail/client';
import type { UserSettings } from '@/lib/integrations/gmail/types';

export async function GET(req: Request) {
  try {
    // Get stored tokens
    const user = await prisma.user.findFirstOrThrow({
      where: { 
        email: 'haloweaveinsights@gmail.com'
      }
    });

    console.log('Found user:', user);

    const settings = user.settings as UserSettings;
    const tokens = settings.gmailTokens;
    
    console.log('Retrieved tokens:', tokens ? 'Present' : 'Missing');
    
    if (!tokens) {
      return NextResponse.json(
        { error: 'Gmail not connected' },
        { status: 400 }
      );
    }

    // Set up credentials and sync emails
    await gmailClient.setCredentials(tokens);
    console.log('Set credentials successfully');

    const messages = await gmailClient.listMessages('', 50);
    console.log('Raw messages from Gmail:', messages);

    const emails = await syncRecentEmails(50);
    console.log('Processed emails:', emails);

    return NextResponse.json({ 
      success: true,
      count: emails.length,
      debug: {
        messagesFound: messages.messages?.length || 0,
        emailsProcessed: emails.length
      }
    });
  } catch (error) {
    console.error('Email sync error:', error);
    return NextResponse.json(
      { error: 'Email sync failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}