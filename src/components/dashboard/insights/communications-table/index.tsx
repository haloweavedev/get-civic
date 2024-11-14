"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Zap } from "lucide-react";
import { format } from 'date-fns';
import { CommunicationDetailModal } from './detail-modal';
import { toast } from 'sonner';
import type { Communication } from '@/types/dashboard';

interface CommunicationsTableProps {
  communications: Communication[];
  pendingCount: number;
  onSync: () => Promise<void>;
  onAnalyze: () => Promise<void>;
}

export function CommunicationsTable({
  communications,
  pendingCount,
  onSync,
  onAnalyze,
}: CommunicationsTableProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedComm, setSelectedComm] = useState<Communication | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Filter communications by type
  const filteredComms = activeTab === 'all'
    ? communications
    : communications.filter((comm) => comm.type === activeTab.toUpperCase());

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await onSync();
      toast.success('Communications synced successfully');
    } catch {
      toast.error('Failed to sync communications');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      await onAnalyze();
      toast.success('Analysis completed successfully');
    } catch {
      toast.error('Failed to analyze communications');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Communications</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            {pendingCount > 0 && (
              <Button
                size="sm"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Analyze ({pendingCount})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="EMAIL">Email</TabsTrigger>
              <TabsTrigger value="SMS">SMS</TabsTrigger>
              <TabsTrigger value="CALL">Call</TabsTrigger>
            </TabsList>

            <div className="mt-4 space-y-4">
              {filteredComms.map((comm) => (
                <div
                  key={comm.id}
                  onClick={() => setSelectedComm(comm)}
                  className="p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge>{comm.type}</Badge>
                      <span className="font-medium">{comm.subject}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {comm.analysis && (
                        <>
                          <Badge
                            variant={
                              comm.analysis.sentiment.label.toLowerCase() === 'positive'
                                ? 'default'
                                : comm.analysis.sentiment.label.toLowerCase() === 'negative'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {comm.analysis.sentiment.label}
                          </Badge>
                          <Badge variant="outline">P{comm.analysis.priority}</Badge>
                        </>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(comm.createdAt), 'PP')}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {comm.content}
                  </p>
                </div>
              ))}
              {filteredComms.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No communications found
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      <CommunicationDetailModal
        communication={selectedComm}
        onClose={() => setSelectedComm(null)}
      />
    </>
  );
}