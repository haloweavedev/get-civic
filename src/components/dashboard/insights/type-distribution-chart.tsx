// src/components/dashboard/insights/type-distribution-chart.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = {
  EMAIL: '#3b82f6',  // blue-500
  SMS: '#8b5cf6',    // violet-500
  CALL: '#f59e0b'    // amber-500
};

interface TypeData {
  type: 'EMAIL' | 'SMS' | 'CALL';
  count: number;
  percentage: number;
}

export function TypeDistributionChart({ data }: { data: TypeData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Communication Types</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={COLORS[entry.type]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 rounded-lg shadow border">
                        <p className="font-medium">{data.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.percentage.toFixed(1)}% ({data.count} communications)
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
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[item.type] }}
              />
              <span className="text-sm text-muted-foreground">
                {item.type} ({item.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}