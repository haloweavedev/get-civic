// src/components/dashboard/metrics/category-highlight.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  category: {
    name: string;
    count: number;
    percentage: number;
  };
  isLoading?: boolean;
}

export function CategoryHighlight({ category, isLoading }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Immediate Attention</CardTitle>
        <Layers className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-9 w-32" />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{category.name}</span>
              <Badge variant="secondary">{category.percentage.toFixed(1)}%</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {category.count} communications
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}