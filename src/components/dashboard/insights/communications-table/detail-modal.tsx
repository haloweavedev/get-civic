// src/components/dashboard/insights/communications-table/detail-modal.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import type { Communication } from '@/types/dashboard';

interface Props {
  communication: Communication | null;
  onClose: () => void;
}

export function CommunicationDetailModal({ communication, onClose }: Props) {
  if (!communication) return null;

  function getSentimentVariant(label: string) {
    switch (label.toLowerCase()) {
      case 'positive': return 'default';
      case 'negative': return 'destructive';
      default: return 'secondary';
    }
  }

  return (
    <Dialog open={!!communication} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{communication.subject || 'Communication Details'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="mt-4 h-[60vh]">
          <div className="grid gap-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-muted-foreground">Type</span>
                <div className="mt-1">
                  <Badge>{communication.type}</Badge>
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-muted-foreground">Date</span>
                <div className="mt-1">
                  {format(new Date(communication.createdAt), 'PPpp')}
                </div>
              </div>
              {communication.analysis && (
                <>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Sentiment</span>
                    <div className="mt-1">
                      <Badge variant={getSentimentVariant(communication.analysis.sentiment.label)}>
                        {communication.analysis.sentiment.label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Priority</span>
                    <div className="mt-1">
                      <Badge variant="outline">P{communication.analysis.priority}</Badge>
                    </div>
                  </div>
                </>
              )}
            </div>

            {communication.analysis?.sentiment.reasoning && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Analysis</span>
                <p className="mt-1 text-sm">{communication.analysis.sentiment.reasoning}</p>
              </div>
            )}

            <div>
              <span className="text-sm font-medium text-muted-foreground">Content</span>
              <div className="mt-1 p-4 rounded-lg bg-muted">
                <pre className="whitespace-pre-wrap text-sm">{communication.content}</pre>
              </div>
            </div>
            
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}