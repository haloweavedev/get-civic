// src/components/dashboard/communications/communications-dashboard.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Phone, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export type CommunicationItem = {
  id: string;
  type: 'EMAIL' | 'CALL' | 'SMS';
  direction: 'INBOUND' | 'OUTBOUND';
  subject: string;
  from: string;
  content: string;
  metadata: any;
  status: string;
  createdAt: string;
  analysis?: {
    sentiment: {
      score: number;
      label: string;
    };
    categories: {
      primary: string;
      secondary: string[];
    };
    summary?: string;
    priority: number;
  };
};

interface CommunicationsResponse {
  success: boolean;
  data: CommunicationItem[];
  error?: string;
}

export function CommunicationsDashboard() {
  const [activeTab, setActiveTab] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: response, isLoading, refetch } = useQuery<CommunicationsResponse>({
    queryKey: ['communications', activeTab],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeTab === 'sms' || activeTab === 'call') {
        params.append('type', activeTab.toUpperCase());
        params.append('metadata.source', 'TWILIO');
      } else if (activeTab === 'email') {
        params.append('type', 'EMAIL');
        params.append('metadata.source', 'GMAIL');
      }
  
      const response = await fetch(`/api/communications?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch communications');
      }
      return response.json();
    }
  });

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const gmailResponse = await fetch('/api/integrations/gmail/sync', { method: 'POST' });
      if (!gmailResponse.ok) {
        throw new Error('Gmail sync failed');
      }

      await refetch();
      toast.success('Communications synced successfully');
    } catch (error) {
      toast.error('Failed to sync communications');
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'EMAIL': return <Mail className="h-4 w-4" />;
      case 'CALL': return <Phone className="h-4 w-4" />;
      case 'SMS': return <MessageSquare className="h-4 w-4" />;
      default: return null;
    }
  };

  const getPriorityBadge = (priority: number) => {
    const colors = {
      5: 'bg-red-100 text-red-800',
      4: 'bg-orange-100 text-orange-800',
      3: 'bg-yellow-100 text-yellow-800',
      2: 'bg-blue-100 text-blue-800',
      1: 'bg-gray-100 text-gray-800'
    };
    return (
      <Badge className={colors[priority as keyof typeof colors] || colors[1]}>
        P{priority}
      </Badge>
    );
  };

  const getSentimentBadge = (sentiment: { label: string; score: number }) => {
    const colors = {
      positive: 'bg-green-100 text-green-800',
      negative: 'bg-red-100 text-red-800',
      neutral: 'bg-gray-100 text-gray-800'
    };
    return (
      <Badge className={colors[sentiment.label.toLowerCase() as keyof typeof colors] || colors.neutral}>
        {sentiment.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Communications Dashboard</h2>
          <Button disabled>Sync All</Button>
        </div>
        <Card>
          <CardContent>
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Communications Dashboard</h2>
        <Button 
          onClick={handleSync} 
          disabled={isSyncing}
        >
          {isSyncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : 'Sync All'}
        </Button>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="EMAIL">Emails</TabsTrigger>
          <TabsTrigger value="CALL">Calls</TabsTrigger>
          <TabsTrigger value="SMS">SMS</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>Recent Communications</CardTitle>
            </CardHeader>
            <CardContent>
              {response?.data && response.data.length > 0 ? (
                <div className="space-y-4">
                  {response.data.map((item: CommunicationItem) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {getIconForType(item.type)}
                          <span className="font-medium">
                            {item.subject || item.from}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        From: {item.from}
                      </div>
                      
                      {item.analysis && (
                        <div className="mt-2 text-sm">
                          <div className="flex gap-2 items-center">
                            {getSentimentBadge(item.analysis.sentiment)}
                            {getPriorityBadge(item.analysis.priority)}
                            <Badge variant="outline">
                              {item.analysis.categories.primary}
                            </Badge>
                          </div>
                          {item.analysis.summary && (
                            <p className="mt-2 text-gray-700">{item.analysis.summary}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No communications found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}