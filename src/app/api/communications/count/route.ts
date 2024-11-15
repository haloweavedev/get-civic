// src/app/api/communications/count/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get counts by source (human vs automated)
    const sourceStats = await prisma.communication.groupBy({
      by: ['source'],
      where: { userId },
      _count: true,
    });

    // Get counts by type (only for human communications)
    const typeStats = await prisma.communication.groupBy({
      by: ['type'],
      where: {
        userId,
        source: 'HUMAN',
      },
      _count: true,
    });

    // Format the response
    const response = {
      bySource: {
        human: sourceStats.find(s => s.source === 'HUMAN')?._count || 0,
        automated: sourceStats.find(s => s.source === 'AUTOMATED')?._count || 0,
      },
      byType: {
        EMAIL: typeStats.find(s => s.type === 'EMAIL')?._count || 0,
        SMS: typeStats.find(s => s.type === 'SMS')?._count || 0,
        CALL: typeStats.find(s => s.type === 'CALL')?._count || 0,
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch communication counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communication counts' },
      { status: 500 }
    );
  }
}