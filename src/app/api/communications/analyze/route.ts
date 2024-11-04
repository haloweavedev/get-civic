// src/app/api/communications/analyze/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { AIAnalysisService } from '@/lib/services/ai-analysis';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { communicationIds } = body;

    if (!Array.isArray(communicationIds)) {
      return NextResponse.json(
        { error: 'communicationIds must be an array' },
        { status: 400 }
      );
    }

    // Verify communications belong to user
    const communications = await prisma.communication.findMany({
      where: {
        id: { in: communicationIds },
        userId,
        status: 'PENDING'
      },
      select: { id: true }
    });

    const validIds = communications.map(c => c.id);
    
    // Analyze communications
    const results = await AIAnalysisService.analyzeMultiple(validIds);

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Analysis failed:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}