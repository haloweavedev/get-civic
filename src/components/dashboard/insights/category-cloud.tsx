"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from 'date-fns';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  AlertCircle,
  Clock,
  BarChart4,
  Mail,
  Phone,
  MessageSquare
} from 'lucide-react';
import type { CategoryData } from '@/types/dashboard';

interface CategoryCloudProps {
  categories: CategoryData[];
}

export function CategoryCloud({ categories }: CategoryCloudProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);

  const sortedCategories = [...categories].sort((a, b) => b.count - a.count);

  // Get icon for communication type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return <Mail className="h-4 w-4 text-blue-500" />;
      case 'CALL': return <Phone className="h-4 w-4 text-amber-500" />;
      case 'SMS': return <MessageSquare className="h-4 w-4 text-violet-500" />;
      default: return null;
    }
  };

  // Get badge style based on count
  const getBadgeStyle = (count: number, totalCount: number) => {
    const percentage = (count / totalCount) * 100;
    if (percentage > 30) return "bg-blue-100 text-blue-800 border-blue-200";
    if (percentage > 15) return "bg-indigo-100 text-indigo-800 border-indigo-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getSentimentBadge = (sentiment: { label: string; score: number }) => {
    const config = {
      positive: { 
        variant: 'default', 
        icon: <CheckCircle className="h-3 w-3" />,
        class: 'bg-green-100 text-green-800 border-green-200'
      },
      negative: { 
        variant: 'destructive', 
        icon: <AlertTriangle className="h-3 w-3" />,
        class: 'bg-red-100 text-red-800 border-red-200'
      },
      neutral: { 
        variant: 'secondary', 
        icon: <Info className="h-3 w-3" />,
        class: 'bg-gray-100 text-gray-800 border-gray-200'
      }
    };
    
    const style = config[sentiment.label.toLowerCase() as keyof typeof config] || config.neutral;
    
    return (
      <Badge className={`${style.class} flex items-center gap-1.5`}>
        {style.icon}
        {sentiment.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: number) => {
    const config = {
      5: { 
        class: 'bg-red-100 text-red-800 border-red-200',
        icon: <AlertTriangle className="h-3 w-3" />,
        label: 'Critical'
      },
      4: { 
        class: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: <AlertCircle className="h-3 w-3" />,
        label: 'High'
      },
      3: { 
        class: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <BarChart4 className="h-3 w-3" />,
        label: 'Medium'
      },
      2: { 
        class: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Info className="h-3 w-3" />,
        label: 'Low'
      },
      1: { 
        class: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <Clock className="h-3 w-3" />,
        label: 'Routine'
      }
    };

    const style = config[priority as keyof typeof config];
    
    return (
      <Badge className={`${style.class} flex items-center gap-1.5`}>
        {style.icon}
        {style.label}
      </Badge>
    );
  };

  const totalCount = sortedCategories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Category Distribution</span>
            <Badge variant="outline" className="ml-2">
              {totalCount} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {sortedCategories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category)}
                className="group flex items-center gap-2 px-4 py-2 rounded-lg
                          bg-card hover:bg-accent/80
                          border border-border hover:border-border/80
                          transition-all duration-200
                          hover:shadow-md"
              >
                <span className="font-medium text-sm group-hover:text-accent-foreground">
                  {category.name}
                </span>
                <Badge 
                  className={`${getBadgeStyle(category.count, totalCount)} transition-all duration-200`}
                >
                  {category.count}
                </Badge>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedCategory} onOpenChange={() => setSelectedCategory(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedCategory?.name}</span>
                  <Badge variant="outline" className="text-sm">
                    {selectedCategory?.count} communications
                  </Badge>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <Separator className="my-2" />
          
          <ScrollArea className="flex-1 pr-6">
            <div className="space-y-4">
              {selectedCategory?.communications.map((comm) => (
                <div 
                  key={comm.id} 
                  className="p-4 rounded-lg border border-border/60 hover:border-border
                            bg-card hover:bg-accent/5 
                            transition-all duration-200 
                            shadow-sm hover:shadow-md"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeIcon(comm.type)}
                        <h4 className="font-medium flex-1">
                          {comm.subject || 'No Subject'}
                        </h4>
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">
                        From: {comm.from}
                      </div>
                    </div>
                    <div className="flex gap-2 items-end">
                      {comm.analysis?.sentiment && getSentimentBadge(comm.analysis.sentiment)}
                      {comm.analysis?.priority && getPriorityBadge(comm.analysis.priority)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {comm.content}
                  </p>
                  
                  <div className="flex justify-between items-center text-xs text-muted-foreground mt-3 pt-2 border-t border-border/50">
                    <span>{formatDistanceToNow(new Date(comm.createdAt), { addSuffix: true })}</span>
                    {comm.analysis?.categories?.primary && (
                      <Badge variant="outline" className="text-xs">
                        {comm.analysis.categories.primary}
                      </Badge>
                    )}
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