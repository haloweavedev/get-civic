"use client";

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface CommunicationStats {
  emailCount: number;
  callCount: number;
  smsCount: number;
  lastSync?: string;
  lastWebhook?: string;
}

async function fetchCommunicationStats(): Promise<CommunicationStats> {
  const emailResponse = await fetch(
    '/api/communications?metadata.source=GMAIL&type=EMAIL'
  );
  const emailData = await emailResponse.json();
  
  const twilioResponse = await fetch(
    '/api/communications?metadata.source=TWILIO'
  );
  const twilioData = await twilioResponse.json();

  if (!emailData.success || !twilioData.success) {
    throw new Error('Failed to fetch communication stats');
  }

  const twilioComms = twilioData.data || [];
  const latestTwilioComm = twilioComms[0];
  const calls = twilioComms.filter((c: any) => c.type === 'CALL');
  const sms = twilioComms.filter((c: any) => c.type === 'SMS');

  return {
    emailCount: (emailData.data || []).length,
    callCount: calls.length,
    smsCount: sms.length,
    lastSync: emailData.data?.[0]?.createdAt,
    lastWebhook: latestTwilioComm?.createdAt
  };
}

export function IntegrationsStatus() {
  const { 
    data: stats,
    isLoading,
    refetch,
    isRefetching,
    error
  } = useQuery({
    queryKey: ['communications-stats'],
    queryFn: fetchCommunicationStats,
    refetchInterval: 60000 // Refresh every minute
  });

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Statistics refreshed');
    } catch (error) {
      toast.error('Failed to refresh statistics');
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">Failed to load integration status</div>
        </CardContent>
      </Card>
    );
  }

  const hasGmailActivity = (stats?.emailCount ?? 0) > 0;
  const hasTwilioActivity = (stats?.callCount ?? 0) > 0 || (stats?.smsCount ?? 0) > 0;

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Integration Status</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefetching}
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
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
          {/* Gmail Integration Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">Gmail Integration</span>
                {hasGmailActivity ? (
                  <Badge variant="default" className="ml-2 bg-green-100 text-green-800">
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-800">
                    <XCircle className="mr-1 h-4 w-4" />
                    No Activity
                  </Badge>
                )}
              </div>
              {stats?.lastSync && (
                <span className="text-sm text-gray-500">
                  Last activity: {formatDistanceToNow(new Date(stats.lastSync), { addSuffix: true })}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              Total emails: {stats?.emailCount ?? 0}
            </div>
          </div>

          {/* Twilio Integration Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">Twilio Integration</span>
                {hasTwilioActivity ? (
                  <Badge variant="default" className="ml-2 bg-green-100 text-green-800">
                    <CheckCircle className="mr-1 h-4 w-4" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-800">
                    <XCircle className="mr-1 h-4 w-4" />
                    No Activity
                  </Badge>
                )}
              </div>
              {stats?.lastWebhook && (
                <span className="text-sm text-gray-500">
                  Last activity: {formatDistanceToNow(new Date(stats.lastWebhook), { addSuffix: true })}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-sm text-gray-600">
                Total calls: {stats?.callCount ?? 0}
              </div>
              <div className="text-sm text-gray-600">
                Total SMS: {stats?.smsCount ?? 0}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default IntegrationsStatus;