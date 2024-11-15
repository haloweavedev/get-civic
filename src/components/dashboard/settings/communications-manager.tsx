// src/components/dashboard/settings/communications-manager.tsx

"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Loader2,
  Trash2,
  RefreshCw,
  EyeOff,
  Eye,
  Mail,
  Phone,
  MessageSquare,
  Filter,
  ChevronDown,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

// Define Communication interface
interface Communication {
  id: string;
  type: 'EMAIL' | 'SMS' | 'CALL';
  subject: string;
  content: string;
  from: string;
  source: 'HUMAN' | 'AUTOMATED' | 'SYSTEM';
  createdAt: string;
  excludeFromAnalysis: boolean;
  isAutomatedResponse: boolean;
  analysis?: {
    sentiment: {
      label: string;
      score: number;
    };
    categories: {
      primary: string;
    };
    priority: number;
  };
}

// Define Props interface
interface CommunicationsManagerProps {
  filter: 'all' | 'human' | 'automated' | 'excluded';
  userId: string;
}

export function CommunicationsManager({ filter, userId }: CommunicationsManagerProps) {
  const [selectedComms, setSelectedComms] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Helper function to build query params
  const buildQueryParams = () => {
    const params = new URLSearchParams({
      filter,
      search: searchTerm,
    });
    if (typeFilter.length > 0) {
      params.append('types', typeFilter.join(','));
    }
    return params.toString();
  };

  // Fetch communications using react-query
  const { data: communications, isLoading } = useQuery<Communication[]>({
    queryKey: ['communications', filter, typeFilter, searchTerm, userId],
    queryFn: async () => {
      const response = await fetch(`/api/settings/communications?${buildQueryParams()}`);
      if (!response.ok) throw new Error('Failed to fetch communications');
      return response.json();
    },
  });

  // Delete mutation for bulk delete
  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/settings/communications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error('Failed to delete communications');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Communications deleted successfully');
      setSelectedComms([]);
      queryClient.invalidateQueries({ queryKey: ['communications'] });
    },
    onError: (error) => {
      toast.error('Failed to delete communications: ' + error.message);
    },
  });

  // Mutation for toggling exclusion from analysis
  const toggleExclusionMutation = useMutation({
    mutationFn: async (data: { ids: string[]; exclude: boolean }) => {
      const response = await fetch('/api/settings/communications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: data.ids,
          excludeFromAnalysis: data.exclude,
        }),
      });
      if (!response.ok) throw new Error('Failed to update communications');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Communications updated successfully');
      setSelectedComms([]);
      queryClient.invalidateQueries({ queryKey: ['communications'] });
    },
    onError: (error) => {
      toast.error('Failed to update communications: ' + error.message);
    },
  });

  // Mutation for reanalysis
  const reanalysisMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/settings/communications/reanalyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!response.ok) throw new Error('Failed to trigger reanalysis');
      return response.json();
    },
    onSuccess: () => {
      toast.success('Reanalysis triggered successfully');
      setSelectedComms([]);
      queryClient.invalidateQueries({ queryKey: ['communications'] });
    },
    onError: (error) => {
      toast.error('Failed to trigger reanalysis: ' + error.message);
    },
  });

  // Function to handle selecting all communications
  const handleSelectAll = () => {
    if (selectedComms.length === communications?.length) {
      setSelectedComms([]);
    } else {
      setSelectedComms(communications?.map(c => c.id) || []);
    }
  };

  // Function to handle individual communication selection
  const handleSelect = (id: string) => {
    setSelectedComms(prev =>
      prev.includes(id) ? prev.filter(commId => commId !== id) : [...prev, id]
    );
  };

  // Function to return appropriate icon for communication type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return <Mail className="h-4 w-4" />;
      case 'CALL': return <Phone className="h-4 w-4" />;
      case 'SMS': return <MessageSquare className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Filters and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search communications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Type Filter
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {['EMAIL', 'SMS', 'CALL'].map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={typeFilter.includes(type)}
                  onCheckedChange={(checked) => {
                    setTypeFilter(prev =>
                      checked ? [...prev, type] : prev.filter(t => t !== type)
                    );
                  }}
                >
                  {getTypeIcon(type)}
                  <span className="ml-2">{type}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {selectedComms.length > 0 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteMutation.mutate(selectedComms)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleExclusionMutation.mutate({ ids: selectedComms, exclude: true })}
              disabled={toggleExclusionMutation.isPending}
            >
              {toggleExclusionMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <EyeOff className="h-4 w-4 mr-2" />
              )}
              Exclude from Analysis
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => reanalysisMutation.mutate(selectedComms)}
              disabled={reanalysisMutation.isPending}
            >
              {reanalysisMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Reanalyze
            </Button>
          </div>
        )}
      </div>

      {/* Communications Table */}
      <Card>
        <ScrollArea className="h-[600px]">
          <table className="w-full">
            <thead className="bg-muted sticky top-0">
              <tr>
                <th className="p-2 text-left">
                  <Checkbox
                    checked={selectedComms.length === communications?.length}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">From</th>
                <th className="p-2 text-left">Content</th>
                <th className="p-2 text-left">Source</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : communications?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-4 text-muted-foreground">
                    No communications found
                  </td>
                </tr>
              ) : (
                communications?.map((comm) => (
                  <tr key={comm.id} className="border-b">
                    <td className="p-2">
                      <Checkbox
                        checked={selectedComms.includes(comm.id)}
                        onCheckedChange={() => handleSelect(comm.id)}
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(comm.type)}
                        <span>{comm.type}</span>
                      </div>
                    </td>
                    <td className="p-2">{comm.from}</td>
                    <td className="p-2">
                      <div className="max-w-md truncate">
                        {comm.content}
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge variant={comm.source === 'HUMAN' ? 'default' : 'secondary'}>
                        {comm.source}
                      </Badge>
                    </td>
                    <td className="p-2">
                      {format(new Date(comm.createdAt), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="p-2">
                      <Badge variant={comm.excludeFromAnalysis ? 'destructive' : 'default'}>
                        {comm.excludeFromAnalysis ? 'Excluded' : 'Included'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollArea>
      </Card>
    </div>
  );
}
