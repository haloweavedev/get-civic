// src/app/api/settings/communications/reanalyze/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { AIAnalysisService } from '@/lib/services/ai-analysis';
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

    // Verify ownership and get communications
    const communications = await prisma.communication.findMany({
      where: {
        id: { in: ids },
        userId,
        source: 'HUMAN', // Only reanalyze human communications
        excludeFromAnalysis: false, // Don't reanalyze excluded communications
      },
      select: { id: true },
    });

    if (communications.length === 0) {
      return NextResponse.json(
        { error: 'No valid communications found for reanalysis' },
        { status: 400 }
      );
    }

    // Delete existing analyses
    await prisma.analysis.deleteMany({
      where: {
        communicationId: { in: communications.map(c => c.id) },
      },
    });

    // Update communications status to trigger reanalysis
    await prisma.communication.updateMany({
      where: {
        id: { in: communications.map(c => c.id) },
      },
      data: {
        status: 'PENDING',
      },
    });

    // Trigger reanalysis
    for (const comm of communications) {
      await AIAnalysisService.analyzeCommunication(comm.id);
    }

    return NextResponse.json({
      success: true,
      reanalyzed: communications.length,
    });
  } catch (error) {
    console.error('Failed to reanalyze communications:', error);
    return NextResponse.json(
      { error: 'Failed to reanalyze communications' },
      { status: 500 }
    );
  }
}