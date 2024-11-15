// src/types/dashboard.ts

// Base interfaces
export interface CommunicationType {
    type: 'EMAIL' | 'SMS' | 'CALL';
  }
  
  export interface SentimentAnalysis {
    label: 'positive' | 'negative' | 'neutral';
    score: number;
    reasoning: string;
  }
  
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
  
  // Strategic Analysis types
  export interface CriticalIssue {
    category: string;
    description: string;
    urgency: string;
    affectedArea: string;
    count: number;
    recentCommunications: Communication[];
  }
  
  export interface StrategicAnalysis {
    timestamp: Date;
    summary: string;
    criticalIssues: CriticalIssue[];
    recommendedActions: string[];
    monitoringPriorities: string[];
  }
  
  // Category and Metrics data
export interface CategoryData {
  name: string;
  count: number;
  percentage: number;
  communications: Array<{
    id: string;
    type: 'EMAIL' | 'SMS' | 'CALL';
    subject: string;
    content: string;
    from: string;
    createdAt: Date;
    status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
    analysis?: {
      sentiment: {
        label: string;
        score: number;
      };
      categories: {
        primary: string;
        secondary: string[];
      };
      priority: number;
    };
  }>;
}
  
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
    strategicAnalysis?: StrategicAnalysis;
  }
  
  // Dashboard props interfaces
  export interface InsightsDashboardProps {
    categories: CategoryData[];
    metrics: MetricsData;
    communications: Communication[];
    stats: {
      totalCommunications: number;
      pendingAnalysis: number;
    };
  }