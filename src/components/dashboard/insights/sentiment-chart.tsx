// src/components/dashboard/insights/sentiment-chart.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = {
  positive: '#22c55e', // green-500
  neutral: '#64748b',  // slate-500
  negative: '#ef4444'  // red-500
};

interface SentimentData {
  label: string;
  count: number;
  percentage: number;
}

export function SentimentChart({ data }: { data: SentimentData[] }) {
  // Transform data for the pie chart
  const chartData = data.map(item => ({
    name: item.label.charAt(0).toUpperCase() + item.label.slice(1),
    value: item.count,
    percentage: item.percentage
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sentiment Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 rounded-lg shadow border">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.percentage.toFixed(1)}% ({data.value} communications)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[item.name.toLowerCase() as keyof typeof COLORS] }}
              />
              <span className="text-sm text-muted-foreground">
                {item.name} ({item.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}