// src/lib/integrations/gmail/handlers/email.ts
import { prisma } from '@/lib/prisma';
import { gmailClient } from '../client';

export async function handleIncomingEmail(messageId: string) {
  try {
    console.log('🚀 Processing email:', messageId);
    const message = await gmailClient.getMessage(messageId);

    if (!message || !message.id) {
      throw new Error('Failed to fetch message details');
    }

    // Extract email headers and basic metadata
    const headers = message.payload?.headers || [];
    const subject = headers.find((h: { name?: string; value?: string }) => h?.name?.toLowerCase() === 'subject')?.value || '';
    const from = headers.find((h: { name?: string; value?: string }) => h?.name?.toLowerCase() === 'from')?.value || '';
    const to = headers.find((h: { name?: string; value?: string }) => h?.name?.toLowerCase() === 'to')?.value || '';
    const date = headers.find((h: { name?: string; value?: string }) => h?.name?.toLowerCase() === 'date')?.value || '';

    // Determine the final content to store
    const bodyContent = message.decodedBody || message.snippet || '';
    console.log('📧 Email details:', {
      id: messageId,
      subject,
      from,
      to,
      date,
      bodyLength: bodyContent.length,
      timestamp: new Date().toISOString()
    });

    // Retrieve default user for email association
    const defaultUser = await prisma.user.findFirstOrThrow({
      where: { email: 'haloweaveinsights@gmail.com' }
    });

    // Create a new communication record in the database
    const communication = await prisma.communication.create({
      data: {
        type: 'EMAIL',
        direction: 'INBOUND',
        rawContent: bodyContent,
        processedContent: bodyContent,
        metadata: JSON.stringify({
          subject,
          from,
          to,
          date,
          messageId: message.id,
          threadId: message.threadId,
          labelIds: message.labelIds,
          headers: message.payload?.headers,
          mimeType: message.payload?.mimeType,
          contentLength: bodyContent.length,
          hasFullContent: bodyContent.length > (message.snippet?.length || 0),
          timestamp: new Date().toISOString()
        }),
        sourceId: message.id,
        source: 'GMAIL',
        status: 'PENDING',
        participants: [from, to],
        organizationId: 'default-org',
        userId: defaultUser.id,
      },
    });

    console.log('✅ Stored email:', {
      id: communication.id,
      contentLength: bodyContent.length,
      hasFullContent: bodyContent.length > (message.snippet?.length || 0)
    });

    return communication;
  } catch (error) {
    console.error('💥 Error processing email:', error);
    throw error;
  }
}

export async function syncRecentEmails(maxResults: number = 10) {
  try {
    console.log(`🔄 Syncing recent emails with maxResults: ${maxResults}`);
    const messages = await gmailClient.listMessages('', maxResults);

    if (!messages.messages) {
      console.log('No messages found to sync.');
      return [];
    }

    const processedMessages = await Promise.all(
      messages.messages.map(async (msg: { id?: string }) => {
        if (!msg.id) return null;

        // Check if this email has already been processed
        const existing = await prisma.communication.findFirst({
          where: {
            sourceId: msg.id,
            source: 'GMAIL',
          },
        });

        if (existing) {
          console.log(`Skipping already processed message ID: ${msg.id}`);
          return existing;
        }

        // Process and save the incoming email
        console.log(`Processing new message ID: ${msg.id}`);
        return handleIncomingEmail(msg.id);
      })
    );

    console.log('🔄 Sync complete. Processed messages:', processedMessages.filter(Boolean).length);
    return processedMessages.filter(Boolean);
  } catch (error) {
    console.error('💥 Error syncing recent emails:', error);
    throw error;
  }
}