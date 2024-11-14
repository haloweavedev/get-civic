import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { InfoIcon } from 'lucide-react';

interface PriorityData {
  level: number;
  count: number;
  percentage: number;
}

const COLORS = {
  P5: "#ef4444", // Critical (Red)
  P4: "#f97316", // High (Orange)
  P3: "#eab308", // Moderate (Yellow)
  P2: "#3b82f6", // Routine (Blue)
  P1: "#64748b"  // Low (Gray)
};

const PRIORITY_INFO = {
  P5: "Critical Urgency",
  P4: "High Priority",
  P3: "Moderate Priority",
  P2: "Routine Priority",
  P1: "Low Priority"
};

export function PriorityChart({ data }: { data: PriorityData[] }) {
  const [showGuide, setShowGuide] = useState(false);
  
  // Transform data for pie chart
  const chartData = data.map(item => ({
    name: `P${item.level}`,
    fullName: PRIORITY_INFO[`P${item.level}` as keyof typeof PRIORITY_INFO],
    value: item.count,
    percentage: item.percentage,
    level: item.level
  })).sort((a, b) => b.level - a.level); // Sort by priority level

  return (
    <Card>
      <CardHeader className="priority-heading-container">
        <div className="flex items-start justify-between">
          <CardTitle>Priority Distribution</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowGuide(true)}
            className="h-8 w-8 rounded-full -mr-2 items-start"
          >
            <InfoIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
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
                    fill={COLORS[entry.name as keyof typeof COLORS]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 rounded-lg shadow border">
                        <p className="font-medium">{data.fullName}</p>
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
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2 min-w-[85px]">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[item.name as keyof typeof COLORS] }}
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {item.name} ({item.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>

      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Understanding Priority Levels</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {Object.entries(PRIORITY_INFO).reverse().map(([key, title]) => (
              <div 
                key={key}
                className="p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: COLORS[key as keyof typeof COLORS] }}
                  />
                  <h3 className="font-semibold">
                    {key} - {title}
                  </h3>
                </div>
                <div className="ml-7 text-sm text-muted-foreground">
                  {getDescription(key)}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function getDescription(priority: string): string {
  switch (priority) {
    case 'P5':
      return 'Immediate threats to life/safety, active crises, critical infrastructure failures, or public health emergencies requiring immediate attention.';
    case 'P4':
      return 'Significant state-wide impacts, economic emergencies, or major community issues needing rapid response.';
    case 'P3':
      return 'Local community concerns, infrastructure improvements, and other important but non-emergency matters.';
    case 'P2':
      return 'General policy feedback, service requests, and routine maintenance matters.';
    case 'P1':
      return 'General comments, thank you messages, and non-urgent feedback.';
    default:
      return '';
  }
}