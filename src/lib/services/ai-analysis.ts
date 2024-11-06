import { openai } from '@/lib/openai';
import { prisma } from '@/lib/prisma';

const ANALYSIS_PROMPT = `As a United States Senator's office, analyze this constituent communication with careful attention to actual sentiment, true urgency, and policy implications. Structure your analysis as valid JSON matching this format:

{
  "sentiment": {
    "score": number (-1 to 1),
    "label": "negative" | "neutral" | "positive",
    "reasoning": string  // Brief explanation of sentiment assessment
  },
  "categories": {
    "primary": string,   // Main policy area
    "secondary": string[], // Related policy areas
    "reasoning": string  // Why these categories were chosen
  },
  "priority": {
    "score": number (1-5),
    "reasoning": string  // Explanation of priority score
  },
  "entities": {
    "locations": string[],
    "organizations": string[],
    "people": string[],
    "issues": string[]
  },
  "intentions": string[],
  "summary": string
}

Priority Scoring Guidelines (1-5):
5 - CRITICAL URGENCY
- Immediate threats to life/safety
- Active crises within our state
- Critical infrastructure failures
- Imminent public health emergencies
- Time-sensitive legislative matters

4 - HIGH PRIORITY
- State-wide policy impacts
- Significant community impacts
- Economic emergencies
- Healthcare access issues
- Housing crises

3 - MODERATE PRIORITY
- Local community concerns
- Infrastructure improvements
- Educational issues
- Environmental concerns
- Healthcare policy feedback

2 - ROUTINE PRIORITY
- Policy feedback
- General suggestions
- Program inquiries
- Service requests
- Infrastructure maintenance

1 - LOW PRIORITY
- General comments
- Thank you messages
- International issues
- Out-of-state matters
- Non-urgent feedback

Sentiment Analysis Guidelines:
- "Positive": Expressions of gratitude, support, or praise
- "Neutral": Factual inquiries, balanced feedback
- "Negative": Concerns, complaints, or urgent issues requiring attention
- Do not let polite language override actual sentiment
- Focus on the core message, not the tone

IMPORTANT:
- Prioritize constituent safety and well-being above all
- Consider immediate vs. long-term impacts
- Weight local/state issues higher than national/international
- Consider number of constituents affected
- Evaluate time sensitivity of the issue
- Account for vulnerable populations impacted
- Consider legislative relevance and timing`;

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