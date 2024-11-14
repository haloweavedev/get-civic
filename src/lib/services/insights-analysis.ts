import { openai } from '../openai';
import { prisma } from '../prisma';
import type { StrategicAnalysis, Communication, CategoryData } from '@/types/dashboard';

const STRATEGIC_ANALYSIS_PROMPT = `You are CIVIC SENTINEL, an advanced governmental intelligence system tasked with strategic analysis of constituent communications. 

Analyze the provided data and generate a high-priority situation assessment following these guidelines:

Context:
- You are addressing senior government officials
- Focus on actionable intelligence derived from constituent communications
- Maintain a professional, authoritative tone appropriate for governmental briefings

Assessment Requirements:
1. Evaluate the distribution of communications across categories
2. Identify critical issues based on priority levels and volume
3. Analyze patterns in high-priority communications
4. Provide strategic recommendations based on the data

Format your response EXACTLY as follows:
{
  "situationOverview": "Concise executive summary of the current situation",
  "criticalIssues": [
    {
      "category": "Category name",
      "description": "Brief description of the issue",
      "urgency": "Description of why this requires attention",
      "affectedArea": "Geographic or demographic scope"
    }
  ],
  "recommendedActions": [
    "Action 1",
    "Action 2",
    "Action 3"
  ],
  "monitoringPriorities": [
    "Priority area 1",
    "Priority area 2"
  ]
}

Use clear, concise language appropriate for governmental communications.
Maintain objectivity while highlighting urgent matters requiring immediate attention.`;

export class InsightsAnalysisService {
  static async getLatestAnalysis(userId: string): Promise<StrategicAnalysis | null> {
    const analysis = await prisma.strategicAnalysis.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });

    return analysis ? this.formatAnalysisFromDb(analysis) : null;
  }

  static async shouldGenerateNewAnalysis(userId: string): Promise<boolean> {
    const latestAnalysis = await prisma.strategicAnalysis.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });

    if (!latestAnalysis) return true;

    // Check if there have been 4 or more new communications
    return latestAnalysis.newCommunicationsCount >= 4;
  }

  static async incrementNewCommunicationsCounter(userId: string): Promise<void> {
    const latestAnalysis = await prisma.strategicAnalysis.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });

    if (latestAnalysis) {
      await prisma.strategicAnalysis.update({
        where: { id: latestAnalysis.id },
        data: {
          newCommunicationsCount: latestAnalysis.newCommunicationsCount + 1
        }
      });
    }
  }

  static async generateAndSaveAnalysis(
    userId: string,
    categoryData: CategoryData[],
    recentHighPriorityCommunications: Communication[]
  ): Promise<StrategicAnalysis> {
    const analysis = await this.generateStrategicAnalysis(
      categoryData,
      recentHighPriorityCommunications
    );

    // Save to database
    await prisma.strategicAnalysis.create({
      data: {
        userId,
        timestamp: new Date(),
        summary: analysis.summary,
        criticalIssues: analysis.criticalIssues,
        recommendedActions: analysis.recommendedActions,
        monitoringPriorities: analysis.monitoringPriorities,
        newCommunicationsCount: 0 // Reset counter
      }
    });

    return analysis;
  }

  static async generateStrategicAnalysis(
    categoryData: CategoryData[],
    recentHighPriorityCommunications: Communication[]
  ): Promise<StrategicAnalysis> {
    try {
      const analysisInput = {
        categories: categoryData.map(cat => ({
          name: cat.name,
          count: cat.count,
          priority: this.calculateCategoryPriority(cat)
        })),
        communications: recentHighPriorityCommunications
      };

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: STRATEGIC_ANALYSIS_PROMPT
          },
          {
            role: "user",
            content: JSON.stringify(analysisInput)
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const analysis = JSON.parse(completion.choices[0].message?.content || '{}');

      // Process critical issues with actual communications data
      const criticalIssues = await this.processCriticalIssues(
        analysis.criticalIssues,
        recentHighPriorityCommunications
      );

      return {
        timestamp: new Date(),
        summary: analysis.situationOverview,
        criticalIssues,
        recommendedActions: analysis.recommendedActions,
        monitoringPriorities: analysis.monitoringPriorities,
      };
    } catch (error) {
      console.error('Strategic analysis generation failed:', error);
      throw error;
    }
  }

  private static async processCriticalIssues(
    issues: CriticalIssue[],
    communications: Communication[]
  ) {
    return Promise.all(issues.map(async (issue) => {
      const relatedComms = communications.filter(
        comm => comm.analysis?.categories?.primary === issue.category
      );

      return {
        category: issue.category,
        description: issue.description,
        urgency: issue.urgency,
        affectedArea: issue.affectedArea,
        count: relatedComms.length,
        recentCommunications: relatedComms.slice(0, 3)
      };
    }));
  }

  private static calculateCategoryPriority(category: CategoryData): number {
    const highPriorityCount = category.communications.filter(
      comm => (comm.analysis?.priority || 0) >= 4
    ).length;
    return (highPriorityCount / category.count) * 5;
  }

  private static formatAnalysisFromDb(dbAnalysis: any): StrategicAnalysis {
    return {
      timestamp: dbAnalysis.timestamp,
      summary: dbAnalysis.summary,
      criticalIssues: dbAnalysis.criticalIssues,
      recommendedActions: dbAnalysis.recommendedActions,
      monitoringPriorities: dbAnalysis.monitoringPriorities,
    };
  }

  static async shouldUpdateAnalysis(lastAnalysis: StrategicAnalysis | null): Promise<boolean> {
    if (!lastAnalysis) return true;

    const timeSinceLastUpdate = Date.now() - lastAnalysis.timestamp.getTime();
    const hoursSinceLastUpdate = timeSinceLastUpdate / (1000 * 60 * 60);

    // Update if more than 4 hours have passed
    if (hoursSinceLastUpdate > 4) return true;

    // Check for new high-priority communications since last update
    const newHighPriorityCommunications = await prisma.communication.count({
      where: {
        createdAt: {
          gt: lastAnalysis.timestamp
        },
        analysis: {
          priority: {
            gte: 4
          }
        }
      }
    });

    return newHighPriorityCommunications > 0;
  }
}