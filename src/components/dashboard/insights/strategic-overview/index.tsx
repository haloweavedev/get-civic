// src/components/dashboard/insights/strategic-overview/index.tsx

'use client';

import { usePerformanceMonitor } from '@/hooks/use-performance';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  Clock,
  Crosshair,
  Target,
  RefreshCw,
  Loader2
} from 'lucide-react';
import type { StrategicAnalysis } from '@/types/dashboard';
import { formatDistanceToNow } from 'date-fns';
import { StrategicOverviewSkeleton } from '@/components/skeletons';

interface StrategicOverviewProps {
  initialData: StrategicAnalysis | null;
  userId: string;
}

interface AnalysisResponse {
  analysis: StrategicAnalysis;
  newCommunicationsCount: number;
  canRefresh: boolean;
}

export function StrategicOverview({ initialData, userId }: StrategicOverviewProps) {
  // Monitor component performance
  usePerformanceMonitor('StrategicOverview');

  // Setup React Query
  const { 
    data, 
    error, 
    isLoading, 
    isRefetching,
    refetch 
  } = useQuery<AnalysisResponse>({
    queryKey: ['strategic-analysis', userId],
    queryFn: async () => {
      const response = await fetch('/api/insights/strategic-analysis');
      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }
      const data = await response.json();
      console.log('Fetched strategic analysis data:', data); // Log data for debugging
      return data;
    },
    initialData: initialData ? {
      analysis: initialData,
      newCommunicationsCount: 0,
      canRefresh: false
    } : undefined,
    refetchInterval: false, // Only refetch manually
    retry: 2 // Retry failed requests twice
  });

  // Handle error state
  if (error) throw error; // ErrorBoundary will catch this

  // Handle loading state and no data state
  if (isLoading || !data || !data.analysis) return <StrategicOverviewSkeleton />;

  // Safely destructure data after checking it exists
  const { analysis, newCommunicationsCount, canRefresh } = data;

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Failed to refresh analysis:', error);
      // Error will be thrown and caught by ErrorBoundary
    }
  };

  return (
    <>
      {/* Hidden element for debugging */}
      <div style={{ display: 'none' }}>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>

      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-slate-700" />
            <CardTitle className="text-lg font-bold tracking-tight">
              CIVIC SENTINEL ASSESSMENT
            </CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Updated {analysis.timestamp ? formatDistanceToNow(new Date(analysis.timestamp), { addSuffix: true }) : 'N/A'}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefetching || !canRefresh}
            >
              {isRefetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Analysis
                  {newCommunicationsCount > 0 && ` (${newCommunicationsCount} new)`}
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Situation Overview */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Crosshair className="h-4 w-4 text-slate-700" />
                <h4 className="text-sm font-semibold text-slate-700">
                  SITUATION OVERVIEW
                </h4>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {analysis.summary}
              </p>
            </div>

            {/* Critical Issues */}
            {analysis.criticalIssues && analysis.criticalIssues.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <h4 className="text-sm font-semibold text-slate-700">
                    CRITICAL ISSUES REQUIRING ATTENTION
                  </h4>
                </div>
                <div className="space-y-4">
                  {analysis.criticalIssues.map((issue, index) => (
                    <div key={index} className="bg-white rounded-lg p-4 border border-slate-200">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-slate-900">{issue.category}</h5>
                        <Badge variant="destructive" className="ml-2">
                          {issue.count} Communications
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{issue.description}</p>
                      <div className="text-sm">
                        <span className="text-amber-600 font-medium">Urgency: </span>
                        <span className="text-slate-600">{issue.urgency}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-700 font-medium">Affected Area: </span>
                        <span className="text-slate-600">{issue.affectedArea}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Actions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-4 w-4 text-slate-700" />
                <h4 className="text-sm font-semibold text-slate-700">
                  RECOMMENDED ACTIONS
                </h4>
              </div>
              <ul className="space-y-2">
                {analysis.recommendedActions && analysis.recommendedActions.map((action, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-slate-400">•</span>
                    <span className="text-sm text-slate-600">{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Monitoring Priorities */}
            {analysis.monitoringPriorities && analysis.monitoringPriorities.length > 0 && (
              <div className="border-t border-slate-200 pt-4">
                <div className="flex flex-wrap gap-2">
                  {analysis.monitoringPriorities.map((priority, index) => (
                    <Badge key={index} variant="secondary" className="bg-slate-100">
                      {priority}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}