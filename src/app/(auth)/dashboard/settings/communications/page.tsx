// src/app/(auth)/dashboard/settings/communications/page.tsx

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { CommunicationsManager } from '@/components/dashboard/settings/communications-manager';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { prisma } from '@/lib/prisma';

interface PageProps {
  searchParams: { tab?: string };
}

export default async function CommunicationsSettingsPage({ searchParams }: PageProps) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Get communication stats using Prisma
  const stats = await prisma.communication.groupBy({
    by: ['source', 'type'],
    where: { userId },
    _count: true,
  });

  // Calculate totals
  const totals = {
    human: stats
      .filter((s) => s.source === 'HUMAN')
      .reduce((acc, curr) => acc + curr._count, 0),
    automated: stats
      .filter((s) => s.source === 'AUTOMATED')
      .reduce((acc, curr) => acc + curr._count, 0),
    excluded: await prisma.communication.count({
      where: {
        userId,
        excludeFromAnalysis: true,
      },
    }),
  };

  // Safely access tab from searchParams
  const activeTab = searchParams?.tab || 'all';

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Communications Settings</h2>
        <p className="text-muted-foreground mt-2">
          Manage your communications data and analysis settings
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Human Communications</p>
            <p className="text-2xl font-bold">{totals.human}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Automated Responses</p>
            <p className="text-2xl font-bold">{totals.automated}</p>
          </div>
        </Card>
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Excluded from Analysis</p>
            <p className="text-2xl font-bold">{totals.excluded}</p>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <Tabs defaultValue={activeTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none px-4">
            <TabsTrigger value="all">All Communications</TabsTrigger>
            <TabsTrigger value="human">Human</TabsTrigger>
            <TabsTrigger value="automated">Automated</TabsTrigger>
            <TabsTrigger value="excluded">Excluded</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <CommunicationsManager filter="all" userId={userId} />
          </TabsContent>
          <TabsContent value="human">
            <CommunicationsManager filter="human" userId={userId} />
          </TabsContent>
          <TabsContent value="automated">
            <CommunicationsManager filter="automated" userId={userId} />
          </TabsContent>
          <TabsContent value="excluded">
            <CommunicationsManager filter="excluded" userId={userId} />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Help Text */}
      <div className="text-sm text-muted-foreground">
        <h3 className="font-medium mb-2">About Communication Management</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Human communications are direct interactions from constituents</li>
          <li>Automated responses are system-generated replies</li>
          <li>Excluded items are not included in analysis or statistics</li>
          <li>You can bulk delete or modify communication settings using the tools above</li>
        </ul>
      </div>
    </div>
  );
}