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
            source: 'GMAIL',
            type: 'EMAIL'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5,
          select: {
            id: true,
            metadata: true,
            createdAt: true,
            processedContent: true,
            status: true
          }
        }
      }
    });
  
    // Parse tokens if they're stored as string
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
        source: 'GMAIL',
        type: 'EMAIL'
      },
      _count: true,
      _max: {
        createdAt: true
      }
    }) : null;
  
    return (
      <GmailIntegrationClient 
        isConnected={isConnected} 
        emailCount={stats?._count || 0}
        lastSynced={stats?._max.createdAt}
        userId={userId}
        latestEmails={user?.communications || []}
      />
    );
  }