// src/app/api/settings/communications/reanalyze/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { AIAnalysisService } from '@/lib/services/ai-analysis';
import { logger } from '@/lib/integrations/utils';
import { z } from 'zod';

const reanalyzeSchema = z.object({
  ids: z.array(z.string()),
});

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { ids } = reanalyzeSchema.parse(body);

    logger.info('Starting reanalysis', { userId, communicationIds: ids });

    const communications = await prisma.communication.findMany({
      where: {
        id: { in: ids },
        userId,
        source: 'HUMAN',
        excludeFromAnalysis: false,
      },
      select: { id: true },
    });

    if (communications.length === 0) {
      logger.warn('No valid communications found', { ids });
      return NextResponse.json(
        { error: 'No valid communications found for reanalysis' },
        { status: 400 }
      );
    }

    const commIds = communications.map(c => c.id);
    
    // Delete existing analyses
    await prisma.analysis.deleteMany({
      where: { communicationId: { in: commIds } },
    });

    // Reset status
    await prisma.communication.updateMany({
      where: { id: { in: commIds } },
      data: { status: 'PENDING' },
    });

    // Trigger reanalysis one at a time to avoid rate limits
    for (const comm of communications) {
      try {
        await AIAnalysisService.analyzeCommunication(comm.id, true);
      } catch (error) {
        logger.error('Failed to analyze communication', {
          communicationId: comm.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      reanalyzed: communications.length,
    });
  } catch (error) {
    logger.error('Reanalysis failed:', error);
    return NextResponse.json(
      { error: 'Failed to reanalyze communications' },
      { status: 500 }
    );
  }
}