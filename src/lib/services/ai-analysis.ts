// src/lib/services/ai-analysis.ts

import { openai } from '@/lib/openai';
import { prisma } from '@/lib/prisma';

const CATEGORY_GUIDELINES = `
When categorizing, use these standard high-level categories and their relevant subcategories:

1. PUBLIC SAFETY
   - Law Enforcement
   - Emergency Services
   - Public Health Safety
   - Infrastructure Safety
   - Community Safety

2. HEALTH & HEALTHCARE
   - Healthcare Access
   - Mental Health
   - Public Health
   - Medical Services
   - Health Insurance
   - Healthcare Policy

3. INFRASTRUCTURE
   - Transportation
   - Public Works
   - Utilities
   - Maintenance
   - Development

4. ENVIRONMENT
   - Climate Change
   - Conservation
   - Environmental Protection
   - Pollution
   - Sustainability

5. HOUSING
   - Affordable Housing
   - Housing Policy
   - Development
   - Homelessness
   - Housing Rights

6. EDUCATION
   - Public Education
   - Higher Education
   - Educational Access
   - School Safety
   - Education Policy

7. ECONOMIC
   - Economic Development
   - Employment
   - Small Business
   - Financial Services
   - Economic Policy

8. SOCIAL SERVICES
   - Community Services
   - Social Programs
   - Family Services
   - Senior Services
   - Disability Services

9. CIVIC ADMINISTRATION
   - Government Services
   - Policy Implementation
   - Administrative Issues
   - Public Records
   - Civic Engagement

10. LEGISLATIVE MATTERS
    - Policy Proposals
    - Legislative Updates
    - Legal Issues
    - Regulatory Concerns
    - Constituent Rights

Choose the most specific and appropriate category. Maintain consistency in naming.`;

const PRIORITY_GUIDELINES = `
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
- Non-urgent feedback`;

const SENTIMENT_ANALYSIS_GUIDELINES = `
Sentiment Analysis Guidelines:
- Assess the constituent's emotional tone and attitude towards the issues discussed.
- Positive sentiment indicates satisfaction, approval, gratitude, or optimism about the current state of affairs.
- Negative sentiment indicates dissatisfaction, disapproval, concern, anger, frustration, or pessimism about the current state of affairs.
- Neutral sentiment indicates a lack of strong emotional expression, or a balanced view.
- Consider both explicit statements and implied emotions.
- Provide reasoning that cites specific language or phrases from the communication that support the sentiment label.
- Do not assume positive sentiment due to polite or formal language.
- Focus on the constituent's feelings towards the issues, not on their manner of expression.
`;

const TYPE_SPECIFIC_PROMPTS = {
  CALL: `Analyze this call transcript with particular attention to:
- Urgency and emotion in voice transcription
- Specific location or jurisdiction mentioned
- Immediate action requirements
- Public safety implications
- Service disruption details
- Emergency response needs`,

  EMAIL: `Analyze this email with particular attention to:
- Policy proposals and implications
- Supporting documentation or references
- Long-term impact assessment
- Legislative suggestions
- Multiple issue coverage
- Formal requests or demands`,

  SMS: `Analyze this SMS with particular attention to:
- Immediate needs or emergencies
- Location-specific issues
- Time-sensitive matters
- Service disruption reports
- Quick response requirements
- Concise issue reporting`
};

const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    sentiment: {
      type: "object",
      properties: {
        score: { type: "number", minimum: -1, maximum: 1 },
        label: { type: "string", enum: ["negative", "neutral", "positive"] },
        reasoning: { type: "string" }
      },
      required: ["score", "label", "reasoning"]
    },
    categories: {
      type: "object",
      properties: {
        primary: { type: "string" },
        secondary: { type: "array", items: { type: "string" } },
        reasoning: { type: "string" }
      },
      required: ["primary", "secondary", "reasoning"]
    },
    priority: {
      type: "object",
      properties: {
        score: { type: "number", minimum: 1, maximum: 5 },
        reasoning: { type: "string" },
        timeframe: { type: "string", enum: ["immediate", "short-term", "long-term"] }
      },
      required: ["score", "reasoning", "timeframe"]
    },
    entities: {
      type: "object",
      properties: {
        locations: { type: "array", items: { type: "string" } },
        organizations: { type: "array", items: { type: "string" } },
        people: { type: "array", items: { type: "string" } },
        issues: { type: "array", items: { type: "string" } }
      },
      required: ["locations", "organizations", "people", "issues"]
    },
    summary: { type: "string" },
    intentions: { type: "array", items: { type: "string" } }
  },
  required: ["sentiment", "categories", "priority", "entities", "summary", "intentions"]
};

const getAnalysisPrompt = (type: 'CALL' | 'EMAIL' | 'SMS' | string) => `
As a United States Senator's office analyst, analyze this constituent ${type.toLowerCase()}.
Provide a structured analysis following these guidelines:

${TYPE_SPECIFIC_PROMPTS[type as keyof typeof TYPE_SPECIFIC_PROMPTS] || ''}

${CATEGORY_GUIDELINES}

${PRIORITY_GUIDELINES}

${SENTIMENT_ANALYSIS_GUIDELINES}

Additional Analysis Guidelines:
- Sentiment should reflect the constituent's feelings about the issues, not the politeness of the message.
- Categories must match our standardized category system.
- Include all relevant location and entity information.
- Consider both immediate and long-term implications.
- Focus on actionable insights.
- Be specific and consistent in categorization.

The response must be a valid JSON object matching this schema:
${JSON.stringify(ANALYSIS_SCHEMA, null, 2)}`;

export type AnalysisResult = {
  sentiment: {
    score: number;
    label: string;
    reasoning: string;
  };
  categories: {
    primary: string;
    secondary: string[];
    reasoning: string;
  };
  priority: {
    score: number;
    reasoning: string;
    timeframe: 'immediate' | 'short-term' | 'long-term';
  };
  entities: {
    locations: string[];
    organizations: string[];
    people: string[];
    issues: string[];
  };
  summary: string;
  intentions: string[];
};

export class AIAnalysisService {
  static async analyzeCommunication(communicationId: string, forceReanalysis: boolean = false): Promise<void> {
    try {
      // Get communication
      const communication = await prisma.communication.findUnique({
        where: { id: communicationId },
        include: {
          analysis: true
        }
      });

      if (!communication) {
        throw new Error(`Communication not found: ${communicationId}`);
      }

      // Skip if already analyzed and not forcing reanalysis
      if (communication.analysis && !forceReanalysis) {
        console.log(`Communication ${communicationId} already analyzed. Skipping.`);
        return;
      }

      // Prepare content for analysis
      const contentToAnalyze = `
Type: ${communication.type}
Subject: ${communication.subject || 'N/A'}
From: ${communication.from}
Content: ${communication.content}
Additional Context: ${JSON.stringify(communication.metadata)}
`.trim();

      // Get AI analysis
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: getAnalysisPrompt(communication.type)
          },
          {
            role: "user",
            content: contentToAnalyze
          }
        ],
        max_tokens: 1500,
        temperature: 0,
      });

      // Parse the assistant's reply
      const assistantReply = completion.choices[0].message?.content || '';

      // Use a try-catch block to parse JSON safely
      let analysisResult: AnalysisResult;
      try {
        analysisResult = JSON.parse(assistantReply) as AnalysisResult;
      } catch (parseError) {
        throw new Error(`Failed to parse analysis result JSON: ${(parseError as Error).message}`);
      }

      // Delete existing analysis if reanalyzing
      if (communication.analysis) {
        await prisma.analysis.delete({
          where: { id: communication.analysis.id }
        });
      }

      // Store analysis results
      await prisma.analysis.create({
        data: {
          communicationId: communication.id,
          version: 'v2',
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

      console.log(`Successfully analyzed communication ${communicationId}`);

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

  static async analyzeMultiple(communicationIds: string[], forceReanalysis: boolean = false): Promise<{
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
        this.analyzeCommunication(id, forceReanalysis)
          .then(() => results.success.push(id))
          .catch(() => results.failed.push(id))
      );

      await Promise.all(promises);
    }

    return results;
  }

  static async reanalyzeAll(): Promise<void> {
    const communications = await prisma.communication.findMany({
      select: { id: true }
    });

    console.log(`Starting reanalysis of ${communications.length} communications...`);
    await this.analyzeMultiple(communications.map(c => c.id), true);
    console.log('Reanalysis complete!');
  }
}