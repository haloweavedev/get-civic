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
    // Check if already processed
    const existing = await prisma.communication.findFirst({
      where: {
        sourceId: metadata.id,
        source: 'GMAIL',
        userId
      }
    });

    if (existing) {
      logger.info('Skipping existing email', { emailId: metadata.id });
      return null;
    }

    // Store in database
    const communication = await prisma.communication.create({
      data: {
        type: 'EMAIL',
        direction: 'INBOUND',
        status: 'PENDING',
        rawContent: content.content,
        processedContent: content.content,
        metadata: {
          ...metadata,
          hasAttachments: content.attachments && content.attachments.length > 0,
          attachmentsCount: content.attachments?.length || 0
        },
        sourceId: metadata.id,
        source: 'GMAIL',
        participants: [metadata.from.email, metadata.to.email],
        userId
      }
    });

    logger.info('Processed new email', { 
      emailId: metadata.id,
      communicationId: communication.id 
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
    // Get messages
    const messages = await gmailClient.listEmails(userId, maxResults);
    let processedCount = 0;

    logger.info('Starting batch sync', { 
      userId, 
      messageCount: messages.length 
    });

    for (const message of messages) {
      try {
        const content = await gmailClient.getEmailContent(userId, message.id);
        const result = await processEmail(userId, message, content);
        if (result) processedCount++;
      } catch (error) {
        logger.error('Failed to process email', {
          emailId: message.id,
          error
        });
      }
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