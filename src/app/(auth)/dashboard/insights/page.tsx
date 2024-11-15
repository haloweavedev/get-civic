// src/app/(auth)/dashboard/insights/page.tsx
import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { InsightsAnalysisService } from '@/lib/services/insights-analysis';
import { ErrorBoundary } from '@/components/error-boundary';
import { InsightsDashboard } from '@/components/dashboard/insights/insights-dashboard';
import {
  MetricsGridSkeleton,
  CategoryCloudSkeleton,
  StrategicOverviewSkeleton,
  CommunicationsTableSkeleton
} from '@/components/skeletons';

// Separate data fetching functions for better performance
async function getCategoryData(userId: string) {
  const result = await prisma.$queryRaw<Array<{
    category: string;
    count: bigint;
    communications: any[];
  }>>`
    WITH CategoryStats AS (
      SELECT 
        COALESCE(jsonb_extract_path_text(a.categories, 'primary'), 'Uncategorized') as category,
        COUNT(*) as count,
        jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'type', c.type,
            'subject', c.subject,
            'content', c.content,
            'from', c."from",
            'createdAt', c."createdAt",
            'status', c.status,
            'analysis', jsonb_build_object(
              'sentiment', a.sentiment,
              'categories', a.categories,
              'priority', a.priority
            )
          )
          ORDER BY c."createdAt" DESC
        ) as communications
      FROM "Communication" c
      LEFT JOIN "Analysis" a ON c.id = a."communicationId"
      WHERE c."userId" = ${userId}
      AND c.status = 'PROCESSED'
      GROUP BY jsonb_extract_path_text(a.categories, 'primary')
    )
    SELECT * FROM CategoryStats
    ORDER BY count DESC
  `;

  const total = result.reduce((sum, cat) => sum + Number(cat.count), 0);

  return result.map(cat => ({
    name: cat.category,
    count: Number(cat.count),
    percentage: (Number(cat.count) / total) * 100,
    communications: cat.communications.slice(0, 5) // Limit to 5 recent communications
  }));
}

async function getMetricsData(userId: string) {
  const [communications, analysis] = await Promise.all([
    prisma.communication.findMany({
      where: {
        userId,
        status: 'PROCESSED',
      },
      include: {
        analysis: true,
      },
      take: 100, // Limit for better performance
    }),
    InsightsAnalysisService.getLatestAnalysis(userId),
  ]);

  // Calculate distributions
  const total = communications.length;
  
  // Sentiment distribution
  const sentimentCounts = communications.reduce((acc, comm) => {
    const sentiment = (comm.analysis?.sentiment as { label?: string })?.label?.toLowerCase() || 'neutral';
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sentiment = Object.entries(sentimentCounts).map(([label, count]) => ({
    label,
    count,
    percentage: (count / total) * 100,
  }));

  // Priority distribution
  const priorityCounts = communications.reduce((acc, comm) => {
    const priority = comm.analysis?.priority || 3;
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const priorities = Object.entries(priorityCounts).map(([level, count]) => ({
    level: parseInt(level),
    count,
    percentage: (count / total) * 100,
  }));

  // Communication type distribution
  const typeData = Object.entries(
    communications.reduce((acc, comm) => {
      acc[comm.type] = (acc[comm.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([type, count]) => ({
    type: type as 'EMAIL' | 'SMS' | 'CALL',
    count,
    percentage: (count / total) * 100,
  }));

  return {
    sentiment,
    priorities,
    communications: typeData,
    strategicAnalysis: analysis
  } as MetricsData;
}

async function getInitialData(userId: string) {
  const [
    categories,
    metrics,
    recentCommunications,
    pendingCount
  ] = await Promise.all([
    getCategoryData(userId),
    getMetricsData(userId),
    prisma.communication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: { analysis: true },
    }),
    prisma.communication.count({
      where: {
        userId,
        status: 'PENDING',
      },
    })
  ]);

  return {
    categories,
    metrics,
    communications: recentCommunications,
    pendingCount,
  };
}

export default async function InsightsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  // Get initial data
  const data = await getInitialData(userId);

  return (
    <div className="space-y-6">
      <ErrorBoundary>
        <Suspense fallback={<MetricsGridSkeleton />}>
          <InsightsDashboard data={data} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}