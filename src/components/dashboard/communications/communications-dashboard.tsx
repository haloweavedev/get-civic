// src/components/dashboard/communications/communications-dashboard.tsx
"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Mail, Phone, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Add type export
export type CommunicationItem = {
  id: string;
  type: 'EMAIL' | 'CALL' | 'SMS';
  direction: 'INBOUND' | 'OUTBOUND';
  metadata: any;
  status: string;
  createdAt: string;
  analysis?: {
    sentiment: {
      score: number;
      label: string;
    };
    categories: string[];
    summary?: string;
  };
};

// Named export for CommunicationsDashboard
export function CommunicationsDashboard() {
  const [activeTab, setActiveTab] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: communications, refetch, isLoading } = useQuery({
    queryKey: ['communications', activeTab],
    queryFn: async () => {
      const response = await fetch(`/api/communications?type=${activeTab}`);
      if (!response.ok) throw new Error('Failed to fetch communications');
      return response.json();
    }
  });

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([
        fetch('/api/integrations/gmail/sync', { method: 'POST' }),
        fetch('/api/integrations/twilio/sync', { method: 'POST' })
      ]);
      await refetch();
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

  const getSentimentColor = (score: number) => {
    if (score > 0.5) return 'text-green-500';
    if (score < -0.5) return 'text-red-500';
    return 'text-yellow-500';
  };

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
              {isLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {communications?.map((item: CommunicationItem) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {getIconForType(item.type)}
                          <span className="font-medium">
                            {item.metadata.subject || item.metadata.from}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        From: {item.metadata.from.email || item.metadata.from}
                      </div>
                      
                      {item.analysis && (
                        <div className="mt-2 text-sm">
                          <div className="flex gap-2">
                            <span className={getSentimentColor(item.analysis.sentiment.score)}>
                              {item.analysis.sentiment.label}
                            </span>
                            {item.analysis.categories.map((category, index) => (
                              <span
                                key={index}
                                className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs"
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                          {item.analysis.summary && (
                            <p className="mt-1 text-gray-700">{item.analysis.summary}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Default export for flexibility
export default CommunicationsDashboard;