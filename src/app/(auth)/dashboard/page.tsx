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
      analysis: { isNot: null }, // Only get communications with analysis
      status: 'PROCESSED'
    },
    include: {
      analysis: true,
    }
  });

  // Return default metrics if no communications found
  if (communications.length === 0) {
    return {
      totalCommunications: 0,
      sentiment: {
        label: 'neutral' as const,
        percentage: 0
      },
      topCategory: {
        name: 'No Data',
        count: 0,
        percentage: 0
      }
    };
  }

  // Calculate total
  const total = communications.length;

  // Calculate sentiment distribution with proper initialization
  const sentimentCounts = communications.reduce((acc, comm) => {
    const sentiment = comm.analysis?.sentiment?.label?.toLowerCase() || 'neutral';
    acc[sentiment] = (acc[sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Find dominant sentiment with safe array handling
  const sentiments = Object.entries(sentimentCounts);
  const dominantSentiment = sentiments.length > 0 
    ? sentiments.reduce((a, b) => a[1] > b[1] ? a : b)
    : ['neutral', 0];

  // Calculate category distribution with safe handling
  const categoryCount = communications.reduce((acc, comm) => {
    const category = comm.analysis?.categories?.primary || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get top category with safe array handling
  const categories = Object.entries(categoryCount);
  const topCategory = categories.length > 0
    ? categories.reduce((a, b) => a[1] > b[1] ? a : b)
    : ['No Data', 0];

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

  try {
    const metrics = await getDashboardMetrics(userId);
    return <DashboardContent userId={userId} metrics={metrics} />;
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    // Return dashboard with empty metrics rather than crashing
    const emptyMetrics = {
      totalCommunications: 0,
      sentiment: {
        label: 'neutral' as const,
        percentage: 0
      },
      topCategory: {
        name: 'Error',
        count: 0,
        percentage: 0
      }
    };
    return <DashboardContent userId={userId} metrics={emptyMetrics} />;
  }
}