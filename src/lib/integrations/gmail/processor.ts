import { gmailClient } from './client';  // Changed from { GmailClient }
import { prisma } from '@/lib/prisma';
import { logger } from '../utils';
import type { EmailMetadata, EmailContent } from './types';

export async function processEmail(
  userId: string,
  metadata: EmailMetadata,
  content: EmailContent
) {
  try {
    // Check if already processed using composite key
    const existing = await prisma.communication.findUnique({
      where: {
        sourceId_userId_source: {
          sourceId: metadata.id,
          userId,
          source: 'GMAIL'
        }
      }
    });

    if (existing) {
      logger.info('Skipping existing email', { emailId: metadata.id });
      return null;
    }

    // Enhanced metadata
    const enrichedMetadata = {
      ...metadata,
      timestamp: new Date(metadata.date).toISOString(),
      hasAttachments: content.attachments && content.attachments.length > 0,
      attachmentsCount: content.attachments?.length || 0,
      threadId: metadata.threadId,
      labels: metadata.labels,
      size: content.content.length
    };

    // Store in database with optimized indexing
    const communication = await prisma.communication.create({
      data: {
        type: 'EMAIL',
        direction: 'INBOUND',
        status: 'PENDING',
        rawContent: content.content,
        processedContent: content.content,
        metadata: enrichedMetadata,
        sourceId: metadata.id,
        source: 'GMAIL',
        participants: [metadata.from.email, metadata.to.email],
        userId
      }
    });

    logger.info('Processed new email', { 
      emailId: metadata.id,
      communicationId: communication.id,
      size: content.content.length,
      hasAttachments: enrichedMetadata.hasAttachments
    });

    return communication;
  } catch (error) {
    logger.error('Email processing failed', {
      emailId: metadata.id,
      error
    });
    throw error;
  }
}

export async function syncEmailBatch(
  userId: string,
  maxResults: number = 50
): Promise<{ total: number; new: number }> {
  try {
    // Get the latest email timestamp from our database
    const latestEmail = await prisma.communication.findFirst({
      where: {
        userId,
        source: 'GMAIL',
        type: 'EMAIL'
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        metadata: true
      }
    });

    const latestTimestamp = latestEmail?.metadata?.timestamp;

    // Get messages since the last sync
    const messages = await gmailClient.listEmails(userId, maxResults);
    let processedCount = 0;

    logger.info('Starting batch sync', { 
      userId, 
      messageCount: messages.length,
      lastSyncTimestamp: latestTimestamp
    });

    // Process in chunks to avoid overwhelming the system
    const chunkSize = 10;
    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);
      
      await Promise.all(chunk.map(async (message) => {
        try {
          // Skip if message is older than our latest email
          if (latestTimestamp && new Date(message.date) <= new Date(latestTimestamp)) {
            return;
          }

          const content = await gmailClient.getEmailContent(userId, message.id);
          const result = await processEmail(userId, message, content);
          if (result) processedCount++;
        } catch (error) {
          logger.error('Failed to process email', {
            emailId: message.id,
            error
          });
        }
      }));
    }

    return {
      total: messages.length,
      new: processedCount
    };
  } catch (error) {
    logger.error('Batch sync failed', error);
    throw error;
  }
}