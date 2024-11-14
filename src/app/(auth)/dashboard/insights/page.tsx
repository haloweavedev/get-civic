import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { InsightsDashboard } from '@/components/dashboard/insights/insights-dashboard';
import type { CategoryData, MetricsData, Communication } from '@/types/dashboard';

async function getInsightsData(userId: string) {
  const communications = await prisma.communication.findMany({
    where: {
      userId,
      status: 'PROCESSED',
    },
    include: {
      analysis: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Process categories
  const categoryMap = new Map<string, CategoryData>();
  communications.forEach((comm) => {
    const category = comm.analysis?.categories?.primary || 'Uncategorized';
    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        name: category,
        count: 0,
        percentage: 0,
        communications: [],
      });
    }
    const categoryData = categoryMap.get(category)!;
    categoryData.count++;
    categoryData.communications.push(comm);
  });

  // Calculate percentages for categories
  const total = communications.length;
  categoryMap.forEach((category) => {
    category.percentage = (category.count / total) * 100;
  });

  // Calculate sentiment distribution
  const sentimentCounts = communications.reduce((acc, comm) => {
    const sentiment = comm.analysis?.sentiment?.label?.toLowerCase() || 'neutral';
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sentimentData = Object.entries(sentimentCounts).map(([label, count]) => ({
    label,
    count,
    percentage: (count / total) * 100,
  }));

  // Calculate priority distribution
  const priorityCounts = communications.reduce((acc, comm) => {
    const priority = comm.analysis?.priority || 3;
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const priorityData = Object.entries(priorityCounts).map(([level, count]) => ({
    level: parseInt(level),
    count,
    percentage: (count / total) * 100,
  }));

  // Calculate type distribution
  const typeCounts = communications.reduce((acc, comm) => {
    acc[comm.type] = (acc[comm.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.entries(typeCounts).map(([type, count]) => ({
    type: type as 'EMAIL' | 'SMS' | 'CALL',
    count,
    percentage: (count / total) * 100,
  }));

  // Get recent communications and pending analysis count
  const recentCommunications = await prisma.communication.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: { analysis: true },
  });

  const pendingCount = await prisma.communication.count({
    where: {
      userId,
      status: 'PENDING',
    },
  });

  return {
    categories: Array.from(categoryMap.values()),
    totalCommunications: total,
    metrics: {
      sentiment: sentimentData,
      priorities: priorityData,
      communications: typeData,
    },
    communications: recentCommunications,
    pendingCount,
  };
}

export default async function InsightsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const data = await getInsightsData(userId);

  return <InsightsDashboard data={data} />;
}