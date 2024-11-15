// src/app/api/settings/communications/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Update the query schema to make types and search optional
const querySchema = z.object({
  filter: z.enum(['all', 'human', 'automated', 'excluded']).default('all'),
  types: z.string().optional().nullable(), // Make it optional and allow null
  search: z.string().optional().nullable(), // Make it optional and allow null
});

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const validatedParams = querySchema.parse({
      filter: searchParams.get('filter') || 'all',
      types: searchParams.get('types'),
      search: searchParams.get('search'),
    });

    // Build the where clause
    const where: any = { userId };

    // Apply filter
    switch (validatedParams.filter) {
      case 'human':
        where.source = 'HUMAN';
        break;
      case 'automated':
        where.source = 'AUTOMATED';
        break;
      case 'excluded':
        where.excludeFromAnalysis = true;
        break;
    }

    // Apply type filter only if types is provided and not empty
    if (validatedParams.types?.length) {
      const types = validatedParams.types.split(',');
      if (types.length > 0) {
        where.type = { in: types };
      }
    }

    // Apply search filter only if search is provided and not empty
    if (validatedParams.search?.length) {
      where.OR = [
        { subject: { contains: validatedParams.search, mode: 'insensitive' } },
        { content: { contains: validatedParams.search, mode: 'insensitive' } },
        { from: { contains: validatedParams.search, mode: 'insensitive' } },
      ];
    }

    const communications = await prisma.communication.findMany({
      where,
      include: {
        analysis: {
          select: {
            sentiment: true,
            categories: true,
            priority: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(communications);
  } catch (error) {
    console.error('Failed to fetch communications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communications' },
      { status: 500 }
    );
  }
}