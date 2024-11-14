// src/components/dashboard/insights/strategic-overview/index.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  Clock,
  Crosshair,
  Target
} from 'lucide-react';
import type { StrategicAnalysis } from '@/types/dashboard';
import { formatDistanceToNow } from 'date-fns';

interface StrategicOverviewProps {
  analysis: StrategicAnalysis;
}

export function StrategicOverview({ analysis }: StrategicOverviewProps) {
  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-slate-700" />
          <CardTitle className="text-lg font-bold tracking-tight">CIVIC SENTINEL ASSESSMENT</CardTitle>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Updated {formatDistanceToNow(new Date(analysis.timestamp), { addSuffix: true })}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Situation Overview */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crosshair className="h-4 w-4 text-slate-700" />
              <h4 className="text-sm font-semibold text-slate-700">SITUATION OVERVIEW</h4>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Critical Issues */}
          {analysis.criticalIssues.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <h4 className="text-sm font-semibold text-slate-700">CRITICAL ISSUES REQUIRING ATTENTION</h4>
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
              <h4 className="text-sm font-semibold text-slate-700">RECOMMENDED ACTIONS</h4>
            </div>
            <ul className="space-y-2">
              {analysis.recommendedActions.map((action, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-slate-400 mt-1">•</span>
                  <span className="text-sm text-slate-600">{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Monitoring Priorities */}
          {analysis.monitoringPriorities && (
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
  );
}