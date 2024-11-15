// src/components/skeletons/category-cloud-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function CategoryCloudSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-[200px]" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton
              key={i}
              className="h-8 w-24 rounded-full"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}