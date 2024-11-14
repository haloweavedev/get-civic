// src/components/dashboard/insights/priority-chart.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface PriorityData {
  level: number;
  count: number;
  percentage: number;
}

export function PriorityChart({ data }: { data: PriorityData[] }) {
  // Sort by priority level
  const sortedData = [...data].sort((a, b) => a.level - b.level);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Priority Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedData}>
              <XAxis 
                dataKey="level"
                tickFormatter={(value) => `P${value}`}
              />
              <YAxis />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 rounded-lg shadow border">
                        <p className="font-medium">Priority {data.level}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.percentage.toFixed(1)}% ({data.count} communications)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="count"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}