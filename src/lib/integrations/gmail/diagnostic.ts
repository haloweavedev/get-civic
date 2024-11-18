import { google } from 'googleapis';
import { gmailClient } from '@/lib/integrations/gmail/client';
import { prisma } from '@/lib/prisma';
import type { Message, GaxiosResponse } from 'googleapis-common';
import type { gmail_v1 } from 'googleapis';

interface EmailHeader {
  name: string;
  value: string;
}

async function diagnoseGmailSync() {
  try {
    console.log('🔍 Starting Gmail Sync Diagnosis\n');

    // 1. Check Gmail Authentication
    console.log('1️⃣ Checking Gmail Authentication...');
    const user = await prisma.user.findFirst({
      where: { 
        email: '3advanceinsights@gmail.com'
      },
      select: {
        id: true,
        settings: true,
        communications: {
          where: {
            type: 'EMAIL',
            metadata: {
              path: ['source'],
              equals: 'GMAIL'
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          select: {
            createdAt: true,
            sourceId: true,
            metadata: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const settings = user.settings as any;
    const tokens = settings.gmailTokens;
    
    if (!tokens) {
      throw new Error('No Gmail tokens found');
    }

    console.log('✅ Found Gmail tokens');
    console.log('Last stored email:', user.communications[0]?.createdAt || 'None');

    // 2. Check Gmail API Access
    console.log('\n2️⃣ Testing Gmail API Access...');
    await gmailClient.setCredentials(tokens);
    
    const gmail = google.gmail({ version: 'v1', auth: gmailClient['oauth2Client'] });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    
    console.log('✅ Gmail API Access Successful');
    console.log('Email:', profile.data.emailAddress);
    console.log('Messages Total:', profile.data.messagesTotal);

    // 3. List Recent Emails
    console.log('\n3️⃣ Fetching Recent Emails...');
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 10,
      q: 'to:3advanceinsights@gmail.com'
    });

    const messages = response.data.messages || [];
    console.log(`Found ${messages.length} messages in Gmail`);

    // 4. Compare with Database
    console.log('\n4️⃣ Comparing with Database...');
    const dbEmails = await prisma.communication.findMany({
      where: {
        userId: user.id,
        type: 'EMAIL',
        metadata: {
          path: ['source'],
          equals: 'GMAIL'
        }
      },
      select: {
        sourceId: true,
        subject: true,
        createdAt: true,
        metadata: true
      }
    });

    console.log(`Found ${dbEmails.length} emails in database`);

    // 5. Check for Missing Emails
    console.log('\n5️⃣ Checking for Missing Emails...');
    const dbEmailIds = new Set(dbEmails.map(e => e.sourceId));
    const missingEmails = messages.filter((m: Message) => !dbEmailIds.has(m.id!));

    if (missingEmails.length > 0) {
      console.log(`Found ${missingEmails.length} emails not in database:`);
      
      // Get details of missing emails
      for (const email of missingEmails) {
        const details = await gmail.users.messages.get({
          userId: 'me',
          id: email.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date']
        });

        const headers = details.data.payload?.headers || [];
        const subject = headers.find((h: EmailHeader) => h.name === 'Subject')?.value || 'No Subject';
        const from = headers.find((h: EmailHeader) => h.name === 'From')?.value || '';
        const date = headers.find((h: EmailHeader) => h.name === 'Date')?.value || '';

        console.log(`\nMissing Email:
  ID: ${email.id}
  Subject: ${subject}
  From: ${from}
  Date: ${date}
        `);
      }
    } else {
      console.log('✅ All Gmail messages are in database');
    }

    // 6. Check Email Processing
    console.log('\n6️⃣ Checking Email Processing Status...');
    const processingStats = await prisma.communication.groupBy({
      by: ['status'],
      where: {
        userId: user.id,
        type: 'EMAIL',
        metadata: {
          path: ['source'],
          equals: 'GMAIL'
        }
      },
      _count: true
    });

    console.log('Processing Status Distribution:');
    console.table(processingStats);

    // 7. Check Token Expiration
    console.log('\n7️⃣ Checking Token Status...');
    const tokenExpiryDate = new Date(tokens.expiry_date);
    const isExpired = tokenExpiryDate < new Date();
    console.log('Token Expiry:', tokenExpiryDate);
    console.log('Token Status:', isExpired ? '❌ Expired' : '✅ Valid');

    console.log('\n🏁 Diagnosis Complete');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}

export default diagnoseGmailSync;