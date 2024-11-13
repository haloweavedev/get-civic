// src/components/dashboard/categories/helpers.ts
export function processAnalysisData(analysisData: any[]) {
    const categoryStats: Record<string, CategoryStats> = {};
  
    analysisData.forEach((analysis) => {
      const categories = analysis.categories as any;
      const primary = categories.primary;
      
      if (!categoryStats[primary]) {
        categoryStats[primary] = {
          category: primary,
          count: 0,
          sentiment: { positive: 0, neutral: 0, negative: 0 },
          priorities: {},
          types: { EMAIL: 0, CALL: 0, SMS: 0 },
          recentCommunications: []
        };
      }
  
      // Update counts
      categoryStats[primary].count++;
      
      // Update sentiment
      const sentiment = (analysis.sentiment as any).label.toLowerCase();
      categoryStats[primary].sentiment[sentiment as keyof typeof categoryStats[string]['sentiment']]++;
      
      // Update priorities
      const priority = analysis.priority;
      categoryStats[primary].priorities[priority] = 
        (categoryStats[primary].priorities[priority] || 0) + 1;
      
      // Update communication types
      const commType = analysis.communication.type;
      categoryStats[primary].types[commType as keyof typeof categoryStats[string]['types']]++;
      
      // Add to recent communications
      categoryStats[primary].recentCommunications.push({
        ...analysis.communication,
        analysis: analysis
      });
    });
  
    // Sort recent communications by date
    Object.values(categoryStats).forEach(stat => {
      stat.recentCommunications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      stat.recentCommunications = stat.recentCommunications.slice(0, 5); // Keep only 5 most recent
    });
  
    return categoryStats;
  }
  
  export function getPriorityData(categoryStats: Record<string, CategoryStats>) {
    const priorityCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    Object.values(categoryStats).forEach(stats => {
      Object.entries(stats.priorities).forEach(([priority, count]) => {
        priorityCounts[priority as unknown as keyof typeof priorityCounts] += count;
      });
    });
  
    return Object.entries(priorityCounts).map(([priority, count]) => ({
      name: `P${priority}`,
      count
    }));
  }
  
  export function getCommunicationTypeData(categoryStats: Record<string, CategoryStats>) {
    const typeCounts = { EMAIL: 0, CALL: 0, SMS: 0 };
    
    Object.values(categoryStats).forEach(stats => {
      Object.entries(stats.types).forEach(([type, count]) => {
        typeCounts[type as keyof typeof typeCounts] += count;
      });
    });
  
    return Object.entries(typeCounts).map(([type, value]) => ({
      name: type,
      value
    }));
  }
  
  export function getAveragePriority(priorities: Record<number, number>): number {
    const total = Object.entries(priorities).reduce(
      (acc, [priority, count]) => acc + (Number(priority) * count), 
      0
    );
    const count = Object.values(priorities).reduce((acc, count) => acc + count, 0);
    return count ? Number((total / count).toFixed(1)) : 0;
  }
  
  export function getSizeClass(count: number): string {
    if (count > 20) return 'text-lg font-bold';
    if (count > 10) return 'text-base font-semibold';
    return 'text-sm';
  }
  
  export function getSentimentVariant(sentiment: string): "default" | "success" | "destructive" {
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'success';
      case 'negative': return 'destructive';
      default: return 'default';
    }
  }