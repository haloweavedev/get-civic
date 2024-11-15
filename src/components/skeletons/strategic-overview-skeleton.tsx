// src/components/skeletons/strategic-overview-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function StrategicOverviewSkeleton() {
  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-[250px]" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-9 w-[120px]" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Situation Overview */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
            <Skeleton className="h-20 w-full" />
          </div>

          {/* Critical Issues */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <Skeleton className="h-5 w-[150px]" />
                    <Skeleton className="h-5 w-[100px]" />
                  </div>
                  <Skeleton className="h-16 w-full mb-2" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[180px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-[180px]" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>

          {/* Monitoring Priorities */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-6 w-24 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}