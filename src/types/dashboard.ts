// src/types/dashboard.ts

// Types related to communication types
export interface CommunicationType {
    type: 'EMAIL' | 'SMS' | 'CALL';
  }
  
  // Sentiment analysis interface
  export interface SentimentAnalysis {
    label: 'positive' | 'negative' | 'neutral';
    score: number; // -1 to 1
    reasoning: string;
    confidence: number; // 0 to 1
  }
  
  // Communication interface
  export interface Communication {
    id: string;
    type: CommunicationType['type'];
    subject: string;
    content: string;
    from: string;
    createdAt: Date;
    status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
    analysis?: {
      sentiment: SentimentAnalysis;
      categories: {
        primary: string;
        secondary: string[];
      };
      priority: number;
    };
  }
  
  // Category data interface
  export interface CategoryData {
    name: string;
    count: number;
    percentage: number;
    communications: Communication[];
  }
  
  // Metrics data interface
  export interface MetricsData {
    sentiment: Array<{
      label: string;
      count: number;
      percentage: number;
    }>;
    priorities: Array<{
      level: number;
      count: number;
      percentage: number;
    }>;
    communications: Array<{
      type: CommunicationType['type'];
      count: number;
      percentage: number;
    }>;
  }

  // Dashboard metrics interface (for simplified metrics display)
  export interface DashboardMetrics {
    totalCommunications: number;
    sentiment: {
      label: 'positive' | 'negative' | 'neutral';
      percentage: number;
    };
    topCategory: {
      name: string;
      count: number;
      percentage: number;
    };
  }
  
  // Insights dashboard props interface
  export interface InsightsDashboardProps {
    categories: CategoryData[];
    metrics: MetricsData;
    communications: Communication[];
    stats: {
      totalCommunications: number;
      pendingAnalysis: number;
    };
  }