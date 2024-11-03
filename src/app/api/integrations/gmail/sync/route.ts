// src/app/api/integrations/gmail/sync/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { gmailClient } from '@/lib/integrations/gmail/client';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/integrations/utils';
import { google } from 'googleapis';

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
  
      // Add more detailed logging
      logger.info('Fetching messages', { 
        userId,
        hasTokens: !!(user.settings as any).gmailTokens 
      });
  
      // Get messages
      const messages = await gmailClient.listEmails(userId);
      let processedCount = 0;
  
      logger.info('Processing messages', { 
        userId,
        messageCount: messages.length 
      });
  
      for (const message of messages) {
        const content = await gmailClient.getEmailContent(userId, message.id);
        await prisma.communication.create({
          data: {
            type: 'EMAIL',
            direction: 'INBOUND',
            status: 'PENDING',
            rawContent: content.content,
            processedContent: content.content,
            metadata: message as unknown as Record<string, any>,
            sourceId: message.id,
            source: 'GMAIL',
            participants: [message.from.email, message.to.email],
            userId
          }
        });
        processedCount++;
        logger.info('Processed message', { 
          userId,
          messageId: message.id,
          processedCount 
        });
      }
  
      logger.info('Sync complete', {
        userId,
        processedCount,
        totalMessages: messages.length
      });
  
      return NextResponse.json({
        success: true,
        processed: processedCount,
        total: messages.length
      });
    } catch (error) {
      logger.error('Email sync failed', error);
      return NextResponse.json(
        { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }