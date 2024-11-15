// src/app/api/settings/communications/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for validating query parameters
const querySchema = z.object({
  filter: z.enum(['all', 'human', 'automated', 'excluded']).default('all'),
  types: z.string().optional().nullable(), // Optional and can be null
  search: z.string().optional().nullable(), // Optional and can be null
});

// Schema for validating DELETE request body
const deleteSchema = z.object({
  ids: z.array(z.string()).min(1, "At least one ID is required"),
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

    // Apply type filter if types are provided and not empty
    if (validatedParams.types?.length) {
      const types = validatedParams.types.split(',');
      if (types.length > 0) {
        where.type = { in: types };
      }
    }

    // Apply search filter if search term is provided and not empty
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

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Delete request body:', body); // Debug log

    const { ids } = deleteSchema.parse(body);

    // Verify ownership of all communications
    const commsToDelete = await prisma.communication.findMany({
      where: {
        id: { in: ids },
        userId,
      },
      select: { id: true },
    });

    console.log('Communications to delete:', commsToDelete); // Debug log

    if (commsToDelete.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some communications not found or not authorized' },
        { status: 403 }
      );
    }

    // Delete associated analyses first
    await prisma.analysis.deleteMany({
      where: {
        communicationId: { in: ids },
      },
    });

    // Delete communications
    const deleteResult = await prisma.communication.deleteMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    console.log('Delete result:', deleteResult); // Debug log

    return NextResponse.json({
      success: true,
      deleted: deleteResult.count,
    });
  } catch (error) {
    console.error('Delete operation failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete communications',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Allow': 'GET, DELETE',
    },
  });
}