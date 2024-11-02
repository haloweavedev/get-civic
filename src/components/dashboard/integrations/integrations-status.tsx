// src/components/dashboard/integrations/integrations-status.tsx
"use client";

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

// Named export for IntegrationsStatus
export function IntegrationsStatus() {
  const { data, isLoading } = useQuery({
    queryKey: ['integrations-status'],
    queryFn: async () => {
      const response = await fetch('/api/test');
      if (!response.ok) throw new Error('Failed to fetch status');
      return response.json();
    },
    refetchInterval: 60000 // Check every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integration Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Gmail Integration Status */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span>Gmail Integration</span>
              {data?.gmail.connected ? (
                <Badge variant="default">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-4 w-4 mr-1" />
                  Disconnected
                </Badge>
              )}
            </div>
            {data?.gmail.lastSync && (
              <span className="text-sm text-gray-500">
                Last synced: {new Date(data.gmail.lastSync).toLocaleString()}
              </span>
            )}
          </div>

          {/* Twilio Integration Status */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span>Twilio Integration</span>
              {data?.twilio.connected ? (
                <Badge variant="default">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-4 w-4 mr-1" />
                  Disconnected
                </Badge>
              )}
            </div>
            {data?.twilio.lastWebhook && (
              <span className="text-sm text-gray-500">
                Last webhook: {new Date(data.twilio.lastWebhook).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Default export for flexibility
export default IntegrationsStatus;