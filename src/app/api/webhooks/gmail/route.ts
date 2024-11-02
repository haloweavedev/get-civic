import { NextResponse } from 'next/server';
import { handleHistoryUpdate } from '@/lib/integrations/gmail/handlers/email';
import { prisma } from '@/lib/prisma';
import { gmailClient } from '@/lib/integrations/gmail/client';
import type { UserSettings } from '@/lib/integrations/gmail/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = JSON.parse(Buffer.from(body.message.data, 'base64').toString());
    const historyId = data.historyId;
    
    const user = await prisma.user.findFirstOrThrow({
      where: { 
        email: 'haloweaveinsights@gmail.com'
      }
    });

    const settings = user.settings as UserSettings;
    const tokens = settings.gmailTokens;
    
    if (!tokens) {
      throw new Error('No Gmail tokens found');
    }

    await gmailClient.setCredentials(tokens);
    await handleHistoryUpdate(historyId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}