// src/components/dashboard/categories/categories-dashboard.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { processAnalysisData, getPriorityData, getCommunicationTypeData, getAveragePriority, getSizeClass } from './helpers';
import { StatCard } from './stat-card';
import { CommunicationCard } from './communication-card';

interface CategoryStats {
  category: string;
  count: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  priorities: Record<number, number>;
  types: {
    EMAIL: number;
    CALL: number;
    SMS: number;
  };
  recentCommunications: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function CategoriesDashboard({ analysisData }: { analysisData: any[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Process data for visualization
  const categoryStats = processAnalysisData(analysisData);

  return (
    <div className="space-y-6">
      {/* Overview Section */}
      <div>
        <h2 className="text-2xl font-bold">Category Analysis</h2>
        <p className="text-muted-foreground">
          Analysis of communications by category and impact
        </p>
      </div>

      {/* Category Cloud */}
      <Card>
        <CardHeader>
          <CardTitle>Category Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(categoryStats).map(([category, stats]) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium 
                  ${getSizeClass(stats.count)} 
                  bg-blue-50 hover:bg-blue-100 transition-colors`}
              >
                {category}
                <Badge className="ml-2 bg-blue-200">{stats.count}</Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getPriorityData(categoryStats)}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Communication Types */}
        <Card>
          <CardHeader>
            <CardTitle>Communication Types by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getCommunicationTypeData(categoryStats)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {getCommunicationTypeData(categoryStats).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Details Modal */}
      <Dialog open={!!selectedCategory} onOpenChange={() => setSelectedCategory(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedCategory}</DialogTitle>
          </DialogHeader>
          {selectedCategory && <CategoryDetails stats={categoryStats[selectedCategory]} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper components and functions
function CategoryDetails({ stats }: { stats: CategoryStats }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Total Communications"
          value={stats.count}
        />
        <StatCard
          title="Sentiment Distribution"
          value={
            <div className="flex gap-2">
              <Badge variant="default">{stats.sentiment.positive}</Badge>
              <Badge variant="secondary">{stats.sentiment.neutral}</Badge>
              <Badge variant="destructive">{stats.sentiment.negative}</Badge>
            </div>
          }
        />
        <StatCard
          title="Average Priority"
          value={getAveragePriority(stats.priorities)}
        />
      </div>

      {/* Recent Communications */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-4">Recent Communications</h3>
        <div className="space-y-4">
          {stats.recentCommunications.map((comm) => (
            <CommunicationCard key={comm.id} communication={comm} />
          ))}
        </div>
      </div>
    </div>
  );
}