// src/app/(auth)/dashboard/settings/communications/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { CommunicationsManager } from '@/components/dashboard/settings/communications-manager';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { prisma } from '@/lib/prisma';

type ValidTab = 'all' | 'human' | 'automated' | 'excluded';

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

const validTabs = ['all', 'human', 'automated', 'excluded'] as const;

function isValidTab(tab: unknown): tab is ValidTab {
  return typeof tab === 'string' && validTabs.includes(tab as ValidTab);
}

export default async function CommunicationsSettingsPage({
  searchParams = Promise.resolve({}),
}: PageProps) {
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

  // Default to 'all' if no valid tab is provided
  let activeTab: ValidTab = 'all';

  try {
    const params = await searchParams;
    const providedTab = params?.tab as string | undefined;

    if (providedTab && isValidTab(providedTab)) {
      activeTab = providedTab;
    }
  } catch (error) {
    console.error('Error parsing tab parameter:', error);
    // Keep default 'all' tab
  }

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
            {validTabs.map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {tab === 'all' ? 'All Communications' : `${tab.charAt(0).toUpperCase() + tab.slice(1)}`}
              </TabsTrigger>
            ))}
          </TabsList>
          {validTabs.map((tab) => (
            <TabsContent key={tab} value={tab}>
              <CommunicationsManager filter={tab} userId={userId} />
            </TabsContent>
          ))}
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