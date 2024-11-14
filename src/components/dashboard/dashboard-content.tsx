// src/components/dashboard/dashboard-content.tsx
"use client";

import { IntegrationsStatus } from "./integrations";
import { TotalCommunications, SentimentSummary, CategoryHighlight } from "./metrics";
import { DashboardMetrics } from "@/types/dashboard";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  userId: string;
  metrics: DashboardMetrics;
}

export function DashboardContent({ userId, metrics }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome to Dashboard
        </h2>
        <p className="text-muted-foreground">Your communication analytics overview</p>
      </div>

      <Suspense fallback={<div>Loading integration status...</div>}>
        <IntegrationsStatus />
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Suspense fallback={<LoadingMetricCard />}>
          <TotalCommunications total={metrics.totalCommunications} />
        </Suspense>

        <Suspense fallback={<LoadingMetricCard />}>
          <SentimentSummary sentiment={metrics.sentiment} />
        </Suspense>

        <Suspense fallback={<LoadingMetricCard />}>
          <CategoryHighlight category={metrics.topCategory} />
        </Suspense>
      </div>
    </div>
  );
}

function LoadingMetricCard() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-2">
          <div className="h-5 w-1/2 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-1/3 bg-gray-200 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export default DashboardContent;