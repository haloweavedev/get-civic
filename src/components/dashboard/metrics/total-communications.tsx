// src/components/dashboard/metrics/total-communications.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  total: number;
  isLoading?: boolean;
}

export function TotalCommunications({ total, isLoading }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Communications</CardTitle>
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <div className="text-2xl font-bold">{total.toLocaleString()}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Across all channels
        </p>
      </CardContent>
    </Card>
  );
}