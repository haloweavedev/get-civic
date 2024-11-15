// src/components/dashboard/metrics/total-communications.tsx
"use client";

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CommunicationCounts {
  bySource: {
    human: number;
    automated: number;
  };
  byType: {
    EMAIL: number;
    SMS: number;
    CALL: number;
  };
}

async function fetchCommunicationCounts(): Promise<CommunicationCounts> {
  const response = await fetch('/api/communications/count');
  if (!response.ok) {
    throw new Error('Failed to fetch communication counts');
  }
  return response.json();
}

export function TotalCommunications() {
  const { data, isLoading, error } = useQuery<CommunicationCounts>({
    queryKey: ['communicationCounts'],
    queryFn: fetchCommunicationCounts,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Handle loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Communications</CardTitle>
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading counts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Communications</CardTitle>
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">Failed to load communication counts</div>
        </CardContent>
      </Card>
    );
  }

  // Calculate total human communications
  const humanTotal = data?.byType.EMAIL + data?.byType.SMS + data?.byType.CALL || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Communications</CardTitle>
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Total Count */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{humanTotal}</span>
              <Badge variant="outline" className="text-xs">
                Human
              </Badge>
            </div>
            {data?.bySource.automated > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                +{data.bySource.automated} automated responses
              </p>
            )}
          </div>

          {/* Type Breakdown */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">{data?.byType.EMAIL || 0}</span> emails
            </div>
            <div>
              <span className="font-medium">{data?.byType.CALL || 0}</span> calls
            </div>
            <div>
              <span className="font-medium">{data?.byType.SMS || 0}</span> SMS
            </div>
          </div>

          {/* Last Updated */}
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}