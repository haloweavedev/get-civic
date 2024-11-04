// src/app/(auth)/dashboard/integrations/gmail/page.tsx

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import GmailIntegrationClient from './gmail-integration-client';
import { redirect } from 'next/navigation';

export default async function GmailSetupPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
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
        take: 5,
        select: {
          id: true,
          metadata: true,
          createdAt: true,
          content: true,
          status: true,
          subject: true, // Added
          from: true,   // Added
        }
      }
    }
  });

  const settings = user?.settings as any;
  const gmailTokens = settings?.gmailTokens 
    ? (typeof settings.gmailTokens === 'string' 
        ? JSON.parse(settings.gmailTokens) 
        : settings.gmailTokens)
    : null;

  const isConnected = !!gmailTokens?.access_token;
  
  const stats = isConnected ? await prisma.communication.aggregate({
    where: {
      userId,
      type: 'EMAIL',
      metadata: {
        path: ['source'],
        equals: 'GMAIL'
      }
    },
    _count: true,
    _max: {
      createdAt: true
    }
  }) : null;

  // Format the emails to match the expected structure
  const formattedEmails = user?.communications.map(email => ({
    id: email.id,
    subject: email.subject,
    from: email.from,
    content: email.content,
    metadata: email.metadata,
    createdAt: email.createdAt,
    status: email.status
  })) || [];

  return (
    <GmailIntegrationClient 
      isConnected={isConnected} 
      emailCount={stats?._count || 0}
      lastSynced={stats?._max.createdAt}
      userId={userId}
      latestEmails={formattedEmails}
    />
  );
}