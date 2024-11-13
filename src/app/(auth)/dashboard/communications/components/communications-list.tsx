// src/app/(auth)/dashboard/communications/components/communications-list.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, RefreshCw, Mail, Phone, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Communication {
  id: string;
  type: string;
  subject: string;
  from: string;
  content: string;
  createdAt: string;
  status: string;
  analysis?: {
    sentiment: {
      label: string;
      score: number;
    };
    summary: string;
    categories: {
      primary: string;
      secondary: string[];
    };
    priority: number;
  };
}

interface CommunicationsListProps {
  type: 'EMAIL' | 'CALL' | 'SMS';
}

export function CommunicationsList({ type }: CommunicationsListProps) {
  const [page, setPage] = useState(1);
  const [selectedComm, setSelectedComm] = useState<Communication | null>(null);
  const pageSize = 10;

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['communications', type, page],
    queryFn: async () => {
      const response = await fetch(
        `/api/communications?type=${type}&limit=${pageSize}&page=${page}`
      );
      return response.json();
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return <Mail className="h-4 w-4" />;
      case 'CALL': return <Phone className="h-4 w-4" />;
      case 'SMS': return <MessageSquare className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PROCESSED':
        return <Badge className="bg-green-100 text-green-800">Processed</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return <Badge className="bg-green-100 text-green-800">{sentiment}</Badge>;
      case 'negative':
        return <Badge className="bg-red-100 text-red-800">{sentiment}</Badge>;
      case 'neutral':
        return <Badge className="bg-gray-100 text-gray-800">{sentiment}</Badge>;
      default:
        return <Badge>{sentiment}</Badge>;
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
      <Badge className={colors[priority as keyof typeof colors]}>
        P{priority}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{type.charAt(0) + type.slice(1).toLowerCase()} Communications</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {data?.data?.map((comm: Communication) => (
                <div
                  key={comm.id}
                  className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                  onClick={() => setSelectedComm(comm)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {getIcon(type)}
                      <span className="font-medium">
                        {comm.subject || 'No Subject'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {comm.analysis && getPriorityBadge(comm.analysis.priority)}
                      {getStatusBadge(comm.status)}
                      <span className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(comm.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    From: {comm.from}
                  </div>
                  
                  {comm.analysis && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        {getSentimentBadge(comm.analysis.sentiment.label)}
                        <Badge variant="outline">
                          {comm.analysis.categories.primary}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {comm.analysis.summary}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {(!data?.data || data.data.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  No {type.toLowerCase()}s found
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-6">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {page}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={!data?.data || data.data.length < pageSize || isFetching}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedComm} onOpenChange={() => setSelectedComm(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Communication Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Type</span>
                <div className="flex items-center gap-2 mt-1">
                  {selectedComm && getIcon(type)}
                  <span>{type}</span>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Date</span>
                <div className="mt-1">
                  {selectedComm && formatDistanceToNow(new Date(selectedComm.createdAt), { addSuffix: true })}
                </div>
              </div>
              {selectedComm?.analysis && (
                <>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Category</span>
                    <div className="mt-1">
                      {selectedComm.analysis.categories.primary}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Sentiment</span>
                    <div className="mt-1">
                      {getSentimentBadge(selectedComm.analysis.sentiment.label)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Priority</span>
                    <div className="mt-1">
                      {getPriorityBadge(selectedComm.analysis.priority)}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status</span>
                    <div className="mt-1">
                      {selectedComm && getStatusBadge(selectedComm.status)}
                    </div>
                  </div>
                </>
              )}
            </div>

            {selectedComm?.analysis?.summary && (
              <div>
                <span className="text-sm font-medium text-gray-500">Summary</span>
                <p className="mt-1 text-gray-900">
                  {selectedComm.analysis.summary}
                </p>
              </div>
            )}

            <div>
              <span className="text-sm font-medium text-gray-500">Full Content</span>
              <div className="mt-1 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                {selectedComm?.content}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}