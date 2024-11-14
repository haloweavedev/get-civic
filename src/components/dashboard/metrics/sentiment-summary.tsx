// src/components/dashboard/metrics/sentiment-summary.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  sentiment: {
    label: 'positive' | 'negative' | 'neutral';
    percentage: number;
  };
  isLoading?: boolean;
}

export function SentimentSummary({ sentiment, isLoading }: Props) {
  const getSentimentColor = (label: string) => {
    switch (label) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">General Sentiment</CardTitle>
        <BarChart className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-9 w-28" />
        ) : (
          <div className="space-y-1">
            <div className="text-2xl font-bold">
              <span className={getSentimentColor(sentiment.label)}>
                {sentiment.label.charAt(0).toUpperCase() + sentiment.label.slice(1)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {sentiment.percentage.toFixed(1)}% of communications
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}