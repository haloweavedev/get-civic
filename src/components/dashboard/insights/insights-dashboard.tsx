"use client";

import { StrategicOverview } from './strategic-overview';
import { CategoryCloud } from './category-cloud';
import { MetricsGrid } from './metrics-grid';
import { CommunicationsTable } from './communications-table';
import { syncCommunications, analyzePendingCommunications } from '@/app/actions';
import { useQuery } from '@tanstack/react-query';
import type { CategoryData, MetricsData, Communication } from '@/types/dashboard';

interface InsightsDashboardProps {
  data: {
    categories: CategoryData[];
    totalCommunications: number;
    metrics: MetricsData;
    communications: Communication[];
    pendingCount: number;
  };
}

export function InsightsDashboard({ data }: InsightsDashboardProps) {
  // Add strategic analysis refresh logic
  const { data: updatedAnalysis, refetch: refetchAnalysis } = useQuery({
    queryKey: ['strategic-analysis'],
    queryFn: async () => {
      const response = await fetch('/api/insights/strategic-analysis');
      return response.json();
    },
    initialData: data.metrics.strategicAnalysis,
    refetchInterval: 1000 * 60 * 15, // Refresh every 15 minutes
  });

  const handleSync = async () => {
    await syncCommunications();
    refetchAnalysis();
  };

  const handleAnalyze = async () => {
    await analyzePendingCommunications();
    refetchAnalysis();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Insights Dashboard</h2>
        <p className="text-muted-foreground">
          Analysis and trends from your communications
        </p>
      </div>

      <CategoryCloud categories={data.categories} />
      <MetricsGrid data={data.metrics} />
      <CommunicationsTable
        communications={data.communications}
        pendingCount={data.pendingCount}
        onSync={handleSync}
        onAnalyze={handleAnalyze}
      />
      {/* Strategic Overview */}
      <StrategicOverview analysis={updatedAnalysis} />
    </div>
  );
}