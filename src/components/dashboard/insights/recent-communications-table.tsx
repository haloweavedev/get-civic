// src/components/dashboard/insights/recent-communications-table.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, MessageSquare } from 'lucide-react';

interface Communication {
  id: string;
  type: 'EMAIL' | 'CALL' | 'SMS';
  subject: string;
  content: string;
  createdAt: string | Date;
  analysis?: {
    sentiment: {
      label: string;
      score: number;
    };
    categories: {
      primary: string;
      secondary: string[];
    };
    priority: number;
    summary: string;
  } | null;
}

interface Props {
  communications: Communication[];
}

export function RecentCommunicationsTable({ communications }: Props) {
  const [selectedComm, setSelectedComm] = useState<Communication | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return <Mail className="h-4 w-4" />;
      case 'CALL':
        return <Phone className="h-4 w-4" />;
      case 'SMS':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      case 'neutral':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 5:
        return 'bg-red-100 text-red-800';
      case 4:
        return 'bg-orange-100 text-orange-800';
      case 3:
        return 'bg-yellow-100 text-yellow-800';
      case 2:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent Communications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Priority</th>
                  <th className="px-6 py-3">Sentiment</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {communications.slice(0, 4).map((comm) => (
                  <tr key={comm.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 flex items-center gap-2">
                      {getTypeIcon(comm.type)}
                      <span>{comm.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      {formatDate(comm.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      {comm.analysis?.categories.primary || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        className={getPriorityColor(comm.analysis?.priority || 0)}
                      >
                        P{comm.analysis?.priority || 'N/A'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        className={getSentimentColor(comm.analysis?.sentiment.label || '')}
                      >
                        {comm.analysis?.sentiment.label || 'N/A'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedComm(comm)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
                  {selectedComm && getTypeIcon(selectedComm.type)}
                  <span>{selectedComm?.type}</span>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Date</span>
                <div className="mt-1">
                  {selectedComm && formatDate(selectedComm.createdAt)}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Category</span>
                <div className="mt-1">
                  {selectedComm?.analysis?.categories.primary || 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Sentiment</span>
                <div className="mt-1">
                  <Badge 
                    className={getSentimentColor(selectedComm?.analysis?.sentiment.label || '')}
                  >
                    {selectedComm?.analysis?.sentiment.label || 'N/A'}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-500">Summary</span>
              <p className="mt-1 text-gray-900">
                {selectedComm?.analysis?.summary || 'No summary available'}
              </p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-500">Full Content</span>
              <div className="mt-1 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                {selectedComm?.content}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}