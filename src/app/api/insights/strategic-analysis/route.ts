// src/app/api/insights/strategic-analysis/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { InsightsAnalysisService } from '@/lib/services/insights-analysis';
import { revalidatePath } from 'next/cache';
import type { CategoryData, Communication } from '@/types/dashboard';

// Type guard to ensure Analysis structure
function mapAnalysis(dbAnalysis: any): Communication['analysis'] {
  if (!dbAnalysis) return undefined;
  
  return {
    sentiment: {
      label: dbAnalysis.sentiment.label || 'neutral',
      score: dbAnalysis.sentiment.score || 0,
      reasoning: dbAnalysis.sentiment.reasoning || ''
    },
    categories: {
      primary: dbAnalysis.categories.primary || 'Uncategorized',
      secondary: dbAnalysis.categories.secondary || []
    },
    priority: dbAnalysis.priority || 0
  };
}

// Map DB communication to our type
function mapCommunication(dbComm: any): Communication {
  return {
    id: dbComm.id,
    type: dbComm.type,
    subject: dbComm.subject,
    content: dbComm.content,
    from: dbComm.from,
    createdAt: dbComm.createdAt,
    status: dbComm.status,
    analysis: mapAnalysis(dbComm.analysis)
  };
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analysis = await InsightsAnalysisService.getLatestAnalysis(userId);
    
    const newCommunicationsCount = analysis
      ? await prisma.communication.count({
          where: {
            userId,
            createdAt: { gt: analysis.timestamp },
            status: 'PROCESSED',
          },
        })
      : 0;

    return NextResponse.json({
      analysis,
      newCommunicationsCount,
      canRefresh: newCommunicationsCount >= 4
    });
  } catch (error) {
    console.error('Strategic analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get raw category data
    const rawCategories = await prisma.$queryRaw<Array<{
      category: string;
      count: number;
    }>>`
      WITH CategoryCounts AS (
        SELECT 
          jsonb_extract_path_text(categories, 'primary') as category,
          COUNT(*) as count
        FROM "Analysis"
        WHERE "Analysis"."communicationId" IN (
          SELECT id FROM "Communication" 
          WHERE "userId" = ${userId} AND status = 'PROCESSED'
        )
        GROUP BY jsonb_extract_path_text(categories, 'primary')
      )
      SELECT * FROM CategoryCounts
      WHERE category IS NOT NULL
      ORDER BY count DESC
    `;

    // Transform to CategoryData
    const total = rawCategories.reduce((sum, cat) => sum + Number(cat.count), 0);
    const categories: CategoryData[] = [];

    for (const cat of rawCategories) {
      // Get communications for this category
      const categoryComms = await prisma.communication.findMany({
        where: {
          userId,
          status: 'PROCESSED',
          analysis: {
            categories: {
              path: ['primary'],
              equals: cat.category
            }
          }
        },
        include: {
          analysis: true
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      });

      categories.push({
        name: cat.category,
        count: Number(cat.count),
        percentage: (Number(cat.count) / total) * 100,
        communications: categoryComms.map(mapCommunication)
      });
    }

    // Get high-priority communications
    const dbCommunications = await prisma.communication.findMany({
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

    // Map to our Communication type
    const communications = dbCommunications.map(mapCommunication);

    // Generate analysis
    const analysis = await InsightsAnalysisService.generateAndSaveAnalysis(
      userId,
      categories,
      communications
    );

    revalidatePath('/dashboard/insights');
    
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Strategic analysis generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    );
  }
}