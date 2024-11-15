// src/components/dashboard/integrations/integrations-status.tsx
"use client";

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

async function fetchCommunicationStats(): Promise<any> {
  const response = await fetch('/api/communications?metadata.source=GMAIL&source=HUMAN');
  const emailData = await response.json();
  
  const twilioResponse = await fetch('/api/communications?metadata.source=TWILIO&source=HUMAN');
  const twilioData = await twilioResponse.json();

  const stats = {
    emailCount: emailData?.data?.length || 0,
    twilioStats: {
      calls: twilioData?.data?.filter((c: any) => c.type === 'CALL')?.length || 0,
      sms: twilioData?.data?.filter((c: any) => c.type === 'SMS')?.length || 0
    },
    lastSync: emailData?.data?.[0]?.createdAt || null,
    lastWebhook: twilioData?.data?.[0]?.createdAt || null
  };

  return stats;
}

export function IntegrationsStatus() {
  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['integration-stats'],
    queryFn: fetchCommunicationStats,
    refetchInterval: 60000 // Refresh every minute
  });

  const handleRefresh = async () => {
    await refetch();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Integration Status</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefetching}
          >
            {isRefetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Gmail Integration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">Gmail Integration</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Active
                </Badge>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Total emails: {stats?.emailCount || 0}
            </div>
          </div>

          {/* Twilio Integration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">Twilio Integration</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Active
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-sm text-gray-600">
                Total calls: {stats?.twilioStats?.calls || 0}
              </div>
              <div className="text-sm text-gray-600">
                Total SMS: {stats?.twilioStats?.sms || 0}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}