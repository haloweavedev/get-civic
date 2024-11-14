// src/app/(auth)/dashboard/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from '@/lib/prisma';
import DashboardContent from '@/components/dashboard/dashboard-content';

async function getDashboardMetrics(userId: string) {
  // Get all communications with analysis
  const communications = await prisma.communication.findMany({
    where: {
      userId,
    },
    include: {
      analysis: true,
    }
  });

  // Calculate total
  const total = communications.length;

  // Calculate sentiment distribution
  const sentimentCounts = communications.reduce((acc, comm) => {
    const sentiment = comm.analysis?.sentiment?.label?.toLowerCase() || 'neutral';
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get dominant sentiment
  const sentiments = Object.entries(sentimentCounts);
  const dominantSentiment = sentiments.reduce((a, b) => a[1] > b[1] ? a : b);

  // Calculate category distribution
  const categoryCount = communications.reduce((acc, comm) => {
    const category = comm.analysis?.categories?.primary || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get top category
  const categories = Object.entries(categoryCount);
  const topCategory = categories.reduce((a, b) => a[1] > b[1] ? a : b);

  return {
    totalCommunications: total,
    sentiment: {
      label: dominantSentiment[0] as 'positive' | 'negative' | 'neutral',
      percentage: (dominantSentiment[1] / total) * 100
    },
    topCategory: {
      name: topCategory[0],
      count: topCategory[1],
      percentage: (topCategory[1] / total) * 100
    }
  };
}

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const metrics = await getDashboardMetrics(userId);

  return <DashboardContent userId={userId} metrics={metrics} />;
}