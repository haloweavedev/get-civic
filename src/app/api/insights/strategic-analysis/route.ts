// src/app/api/insights/strategic-analysis/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { InsightsAnalysisService } from '@/lib/services/insights-analysis';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get high-priority communications
    const communications = await prisma.communication.findMany({
      where: {
        userId,
        status: 'PROCESSED',
        analysis: {
          priority: {
            gte: 4
          }
        }
      },
      include: {
        analysis: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 6
    });

    // Get category data
    const categories = await prisma.analysis.groupBy({
      by: ['categories'],
      _count: true,
      orderBy: {
        _count: 'desc'
      }
    });

    // Generate new analysis
    const analysis = await InsightsAnalysisService.generateStrategicAnalysis(
      categories,
      communications
    );

    revalidatePath('/dashboard/insights');
    
    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Strategic analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    );
  }
}