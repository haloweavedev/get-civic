// src/components/dashboard/insights/insights-dashboard.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RecentCommunicationsTable } from './recent-communications-table';
import { toast } from 'sonner';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { Loader2, RefreshCw } from 'lucide-react';

interface Communication {
  id: string;
  status: string;
  subject: string;
  content: string;
  analysis?: {
    sentiment: any;
    priority: number;
  } | null;
}

interface InsightsDashboardProps {
  communications: Communication[];
  stats: Array<{
    status: string;
    _count: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function InsightsDashboard({ 
  communications,
  stats 
}: InsightsDashboardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  console.log('Dashboard received communications:', communications.length);
  console.log('Status stats:', stats);

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      
      // Get all pending communications
      const pendingComms = communications
        .filter(comm => comm.status === 'PENDING')
        .map(comm => comm.id);

      console.log('Found pending communications:', pendingComms.length);

      if (pendingComms.length === 0) {
        toast.info('No pending communications to analyze');
        return;
      }

      // Call analysis endpoint
      const response = await fetch('/api/communications/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          communicationIds: pendingComms,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      console.log('Analysis result:', result);
      
      if (result.success) {
        toast.success(`Analyzed ${result.results.success.length} communications`);
        // Refresh the page to show new analysis
        window.location.reload();
      }

    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze communications');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Only process analyzed communications for charts
  const analyzedComms = communications.filter(comm => comm.analysis);
  
  console.log('Analyzed communications:', analyzedComms.length);

  // Prepare data for visualizations
  const priorityData = analyzedComms.reduce((acc: any[], curr) => {
    if (!curr.analysis?.priority) return acc;
    
    const priority = curr.analysis.priority;
    const existing = acc.find(item => item.priority === priority);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ priority, count: 1 });
    }
    return acc;
  }, []);

  const sentimentData = analyzedComms.reduce((acc: any[], curr) => {
    if (!curr.analysis?.sentiment) return acc;
    
    const sentiment = curr.analysis.sentiment.label || 'neutral';
    const existing = acc.find(item => item.name === sentiment);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: sentiment, value: 1 });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {analyzedComms.length} of {communications.length} communications analyzed
        </div>
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Analyze Pending
            </>
          )}
        </Button>
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Communications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {communications.length}
            </div>
          </CardContent>
        </Card>

        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.status} Communications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat._count}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {priorityData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Priority Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priority" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Priority Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
              No priority data available yet
            </CardContent>
          </Card>
        )}

        {sentimentData.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Analysis</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
              No sentiment data available yet
            </CardContent>
          </Card>
        )}
      </div>

        {/* Recent Communications */}
        <RecentCommunicationsTable communications={communications as Communication[]} />
        
    </div>
  );
}