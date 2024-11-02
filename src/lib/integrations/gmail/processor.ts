import { prisma } from '@/lib/prisma';
import { GmailClient } from './client';
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
        source: 'GMAIL'
      }
    });

    if (existing) return null;

    // Store in database
    const communication = await prisma.communication.create({
      data: {
        type: 'EMAIL',
        direction: 'INBOUND',
        status: 'PENDING',
        rawContent: content.content,
        processedContent: '',
        metadata: {
          ...metadata,
          hasAttachments: content.attachments && content.attachments.length > 0,
          attachmentsCount: content.attachments?.length || 0
        },
        sourceId: metadata.id,
        source: 'GMAIL',
        participants: [metadata.from.email, metadata.to.email],
        organizationId: 'default-org',
        userId
      }
    });

    return communication;
  } catch (error) {
    throw await handleIntegrationError(error);
  }
}

export async function syncEmailBatch(
  userId: string,
  maxResults: number = 50
): Promise<{ total: number; new: number }> {
  const client = new GmailClient();
  const emails = await client.listEmails(userId, maxResults);

  const results = await Promise.allSettled(
    emails.map(async (email) => {
      const content = await client.getEmailContent(userId, email.id);
      return processEmail(userId, email, content);
    })
  );

  const processed = results.filter(
    (result): result is PromiseFulfilledResult<any> => 
      result.status === 'fulfilled' && result.value !== null
  );

  return {
    total: emails.length,
    new: processed.length
  };
}