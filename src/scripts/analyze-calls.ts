// src/scripts/analyze-calls.ts
import { prisma } from '@/lib/prisma';
import { AIAnalysisService } from '@/lib/services/ai-analysis';

async function analyzeUnprocessedCalls() {
  const calls = await prisma.communication.findMany({
    where: {
      type: 'CALL',
      status: 'PROCESSED',
      analysis: null
    }
  });

  console.log(`Found ${calls.length} unanalyzed calls`);

  for (const call of calls) {
    try {
      await AIAnalysisService.analyzeCommunication(call.id);
      console.log(`Analyzed call: ${call.id}`);
    } catch (error) {
      console.error(`Failed to analyze call ${call.id}:`, error);
    }
  }
}

analyzeUnprocessedCalls();