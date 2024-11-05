// src/app/api/communications/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/integrations/utils';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build where clause
    const where: any = {
      userId,
    };

    if (type) {
      where.type = type;
    }

    if (source) {
      where.metadata = {
        path: ['source'],
        equals: source
      };
    }

    // Only add source filter if specified
    if (source) {
      where.metadata = {
        path: ['source'],
        equals: source
      };
    }

    logger.info('Fetching communications', { where, limit });

    const communications = await prisma.communication.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      include: {
        analysis: true
      }
    });

    logger.info('Found communications', { count: communications.length });

    return NextResponse.json({
      success: true,
      data: communications
    });

  } catch (error) {
    logger.error('Failed to fetch communications', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch communications'
      }, 
      { status: 500 }
    );
  }
}