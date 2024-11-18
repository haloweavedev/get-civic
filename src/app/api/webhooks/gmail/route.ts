import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { gmailClient } from '@/lib/integrations/gmail/client';
import { logger } from '@/lib/integrations/utils';
import { GmailTokens } from '@/lib/integrations/gmail/types';
import { syncEmailBatch } from '@/lib/integrations/gmail/processor';
import { IntegrationError } from '@/lib/integrations/errors';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = JSON.parse(Buffer.from(body.message.data, 'base64').toString());
    const historyId = data.historyId;
    
    const user = await prisma.user.findFirstOrThrow({
      where: { 
        email: '3advanceinsights@gmail.com'
      }
    });

    const settings = user.settings as { gmailTokens?: GmailTokens };
    const tokens = settings.gmailTokens;
    
    if (!tokens) {
      throw new IntegrationError('No Gmail tokens found', 'NO_TOKENS', 401);
    }

    await gmailClient.setCredentials(tokens);
    
    // Sync recent emails when we receive a webhook
    // This is a simpler approach than implementing history.list
    await syncEmailBatch(user.id, 10);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Webhook error:', error);
    
    const integrationError = error instanceof IntegrationError ? error : new IntegrationError(
      'Webhook processing failed',
      'WEBHOOK_ERROR',
      500,
      error
    );

    return NextResponse.json(
      { 
        error: integrationError.message,
        code: integrationError.code,
        details: integrationError.details
      },
      { status: integrationError.status || 500 }
    );
  }
}