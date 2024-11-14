"use client";

import { CategoryCloud } from './category-cloud';
import { MetricsGrid } from './metrics-grid';
import { CommunicationsTable } from './communications-table';
import { syncCommunications, analyzePendingCommunications } from '@/app/actions';
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
        onSync={syncCommunications}
        onAnalyze={analyzePendingCommunications}
      />
    </div>
  );
}