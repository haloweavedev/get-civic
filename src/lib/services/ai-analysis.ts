// src/lib/services/ai-analysis.ts

import { openai } from '@/lib/openai';
import { prisma } from '@/lib/prisma';
import { CommunicationType } from '@prisma/client';

const ANALYSIS_PROMPT = `Analyze this constituent communication and provide a structured analysis. Consider the content, context, and implications. Output must be valid JSON matching this exact structure:
{
  "sentiment": {
    "score": number, // -1 to 1
    "label": string  // "negative", "neutral", or "positive"
  },
  "categories": {
    "primary": string,    // Main policy area
    "secondary": string[] // Related policy areas
  },
  "priority": {
    "score": number,     // 1 to 5
    "reasons": string[]  // Why this score was given
  },
  "entities": {
    "locations": string[],
    "organizations": string[],
    "people": string[],
    "issues": string[]
  },
  "intentions": string[], // e.g., "request_action", "express_concern"
  "summary": string,     // 2-3 sentence summary
  "key_points": string[] // Main points from the message
}

Priority Scoring Guide:
5: Urgent humanitarian/life-threatening issues
4: Immediate policy concerns affecting many people
3: Community-wide issues needing attention
2: Individual concerns or requests
1: General feedback or inquiries

Focus on factual analysis and avoid any political bias.`;

export type AnalysisResult = {
  sentiment: {
    score: number;
    label: string;
  };
  categories: {
    primary: string;
    secondary: string[];
  };
  priority: {
    score: number;
    reasons: string[];
  };
  entities: {
    locations: string[];
    organizations: string[];
    people: string[];
    issues: string[];
  };
  intentions: string[];
  summary: string;
  key_points: string[];
};

export class AIAnalysisService {
  static async analyzeCommunication(communicationId: string): Promise<void> {
    try {
      // Get communication
      const communication = await prisma.communication.findUnique({
        where: { id: communicationId },
        select: {
          id: true,
          type: true,
          content: true,
          subject: true,
          from: true,
          metadata: true,
        },
      });

      if (!communication) {
        throw new Error(`Communication not found: ${communicationId}`);
      }

      // Prepare content for analysis
      const contentToAnalyze = `
Subject: ${communication.subject}
From: ${communication.from}
Content: ${communication.content}
      `.trim();

      // Get AI analysis
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: ANALYSIS_PROMPT
          },
          {
            role: "user",
            content: contentToAnalyze
          }
        ],
        response_format: { type: "json_object" }
      });

      const analysisResult = JSON.parse(completion.choices[0].message.content || '{}') as AnalysisResult;

      // Store analysis results
      await prisma.analysis.create({
        data: {
          communicationId: communication.id,
          version: 'v1',
          sentiment: analysisResult.sentiment,
          summary: analysisResult.summary,
          categories: analysisResult.categories,
          entities: analysisResult.entities,
          intentions: analysisResult.intentions,
          priority: analysisResult.priority.score,
          language: 'en',
          confidence: 1.0,
          processingTime: Math.floor(completion.usage?.total_tokens || 0),
        },
      });

      // Update communication status
      await prisma.communication.update({
        where: { id: communication.id },
        data: { status: 'PROCESSED' },
      });

    } catch (error) {
      console.error('Analysis failed:', error);
      
      // Update communication status to failed
      await prisma.communication.update({
        where: { id: communicationId },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  }

  static async analyzeMultiple(communicationIds: string[]): Promise<{
    success: string[];
    failed: string[];
  }> {
    const results = {
      success: [] as string[],
      failed: [] as string[],
    };

    // Process in batches of 5 to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < communicationIds.length; i += batchSize) {
      const batch = communicationIds.slice(i, i + batchSize);
      
      // Process batch in parallel
      const promises = batch.map(id => 
        this.analyzeCommunication(id)
          .then(() => results.success.push(id))
          .catch(() => results.failed.push(id))
      );

      await Promise.all(promises);
    }

    return results;
  }
}