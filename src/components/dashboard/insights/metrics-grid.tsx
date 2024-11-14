// src/components/dashboard/insights/metrics-grid.tsx
"use client";

import { SentimentChart } from './sentiment-chart';
import { PriorityChart } from './priority-chart';
import { TypeDistributionChart } from './type-distribution-chart';
import type { MetricsData } from '@/types/dashboard';

export function MetricsGrid({ data }: { data: MetricsData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
      <SentimentChart data={data.sentiment} />
      <PriorityChart data={data.priorities} />
      <TypeDistributionChart data={data.communications} />
    </div>
  );
}