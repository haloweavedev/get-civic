"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CategoryData, Communication } from '@/types/dashboard';

interface CategoryCloudProps {
  categories: CategoryData[];
}

export function CategoryCloud({ categories }: CategoryCloudProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);

  // Sort categories by count
  const sortedCategories = [...categories].sort((a, b) => b.count - a.count);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Category Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {sortedCategories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category)}
                className="inline-flex items-center px-4 py-2 rounded-lg
                          bg-card hover:bg-accent
                          border border-border
                          transition-colors duration-200"
              >
                <span className="font-medium text-sm">{category.name}</span>
                <Badge className="ml-2" variant="secondary">
                  {category.count}
                </Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedCategory} onOpenChange={() => setSelectedCategory(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedCategory?.name}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="mt-4 max-h-[60vh]">
            <div className="space-y-4">
              {selectedCategory?.communications.map((comm) => (
                <div key={comm.id} className="p-4 rounded-lg border">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{comm.subject}</h4>
                    <Badge variant={getSentimentVariant(comm.analysis?.sentiment)}>
                      {comm.analysis?.sentiment?.label ?? 'Unknown'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {comm.content}
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {new Date(comm.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getSentimentVariant(sentiment: { label: string } | undefined): "default" | "secondary" | "destructive" | "outline" | null | undefined {
  if (!sentiment || !sentiment.label) {
    return 'secondary';
  }

  switch (sentiment.label) {
    case 'positive': return 'default';
    case 'negative': return 'destructive';
    default: return 'secondary';
  }
}