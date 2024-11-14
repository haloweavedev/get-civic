"use client";

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Zap, Filter, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from 'date-fns';
import { CommunicationDetailModal } from './detail-modal';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [selectedPriorities, setSelectedPriorities] = useState<number[]>([]);

  const handlePriorityToggle = (priority: number) => {
    setSelectedPriorities(current =>
      current.includes(priority)
        ? current.filter(p => p !== priority)
        : [...current, priority]
    );
  };

  const filteredAndSortedComms = useMemo(() => {
    let filtered = communications;

    if (activeTab !== 'all') {
      filtered = filtered.filter(
        comm => comm.type === activeTab.toUpperCase()
      );
    }

    if (selectedPriorities.length > 0) {
      filtered = filtered.filter(
        comm => selectedPriorities.includes(comm.analysis?.priority || 0)
      );
    }

    return [...filtered].sort((a, b) => 
      (b.analysis?.priority || 0) - (a.analysis?.priority || 0)
    );
  }, [communications, activeTab, selectedPriorities]);

  const getPriorityBadge = (priority: number) => {
    const variants = {
      5: { color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="h-3 w-3" /> },
      4: { color: 'bg-orange-100 text-orange-800', icon: <AlertTriangle className="h-3 w-3" /> },
      3: { color: 'bg-yellow-100 text-yellow-800' },
      2: { color: 'bg-blue-100 text-blue-800' },
      1: { color: 'bg-gray-100 text-gray-800', icon: <CheckCircle className="h-3 w-3" /> }
    };

    const variant = variants[priority as keyof typeof variants];
    return (
      <Badge className={`flex items-center gap-1 ${variant.color}`}>
        {variant.icon}
        <span>P{priority}</span>
      </Badge>
    );
  };

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <CardTitle>Recent Communications</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-4">
                <Filter className="h-4 w-4 mr-2" />
                Priority Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {[5, 4, 3, 2, 1].map((priority) => (
                <DropdownMenuCheckboxItem
                  key={priority}
                  checked={selectedPriorities.includes(priority)}
                  onCheckedChange={() => handlePriorityToggle(priority)}
                >
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(priority)}
                    <span className="text-sm">
                      {priority === 5 ? "Critical" :
                       priority === 4 ? "High" :
                       priority === 3 ? "Medium" :
                       priority === 2 ? "Low" :
                       "Routine"}
                    </span>
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
            {filteredAndSortedComms.map((comm) => (
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
                        {getPriorityBadge(comm.analysis.priority)}
                        {/* Add more badges as necessary */}
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
            {filteredAndSortedComms.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No communications found
              </div>
            )}
          </div>
        </Tabs>
      </CardContent>

      <CommunicationDetailModal
        communication={selectedComm}
        onClose={() => setSelectedComm(null)}
      />
    </Card>
  );
}