// src/app/api/integrations/gmail/sync/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { gmailClient } from '@/lib/integrations/gmail/client';
import { logger } from '@/lib/integrations/utils';
import { revalidatePath } from 'next/cache';
import { AIAnalysisService } from '@/lib/services/ai-analysis';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's Gmail tokens
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true }
    });

    if (!user?.settings || !(user.settings as any).gmailTokens) {
      return NextResponse.json(
        { error: 'Gmail not connected' },
        { status: 400 }
      );
    }

    // Sync emails
    const result = await gmailClient.syncEmails(userId);

    // If there's an error, return it
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // If we have new emails, trigger analysis
    if (result.new > 0) {
      // Get IDs of new emails
      const newEmails = await prisma.communication.findMany({
        where: {
          userId,
          type: 'EMAIL',
          status: 'PENDING',
          metadata: {
            path: ['source'],
            equals: 'GMAIL'
          }
        },
        select: { id: true }
      });

      // Trigger analysis for new emails
      await Promise.all(
        newEmails.map(email => 
          AIAnalysisService.analyzeCommunication(email.id)
            .catch(error => logger.error(`Analysis failed for email ${email.id}:`, error))
        )
      );
    }

    // Update last sync timestamp
    await prisma.user.update({
      where: { id: userId },
      data: {
        settings: {
          ...(user.settings as any),
          lastGmailSync: new Date().toISOString()
        }
      }
    });

    // Revalidate relevant paths
    revalidatePath('/dashboard/communications/email');
    revalidatePath('/dashboard/integrations/gmail');
    revalidatePath('/dashboard/insights');

    return NextResponse.json({
      success: true,
      new: result.new,
      total: result.total
    });

  } catch (error) {
    logger.error('Email sync failed:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}