// src/app/api/settings/communications/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Input validation schemas
const querySchema = z.object({
  filter: z.enum(['all', 'human', 'automated', 'excluded']).default('all'),
  types: z.string().optional(),
  search: z.string().optional(),
});

const deleteSchema = z.object({
  ids: z.array(z.string()),
});

const updateSchema = z.object({
  ids: z.array(z.string()),
  excludeFromAnalysis: z.boolean(),
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

    // Apply type filter
    if (validatedParams.types) {
      const types = validatedParams.types.split(',');
      if (types.length > 0) {
        where.type = { in: types };
      }
    }

    // Apply search
    if (validatedParams.search) {
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
    const { ids } = deleteSchema.parse(body);

    // Verify ownership of all communications
    const commsToDelete = await prisma.communication.findMany({
      where: {
        id: { in: ids },
        userId,
      },
      select: { id: true },
    });

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
    await prisma.communication.deleteMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete communications:', error);
    return NextResponse.json(
      { error: 'Failed to delete communications' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { ids, excludeFromAnalysis } = updateSchema.parse(body);

    // Verify ownership of all communications
    const commsToUpdate = await prisma.communication.findMany({
      where: {
        id: { in: ids },
        userId,
      },
      select: { id: true },
    });

    if (commsToUpdate.length !== ids.length) {
      return NextResponse.json(
        { error: 'Some communications not found or not authorized' },
        { status: 403 }
      );
    }

    // Update communications
    await prisma.communication.updateMany({
      where: {
        id: { in: ids },
        userId,
      },
      data: {
        excludeFromAnalysis,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update communications:', error);
    return NextResponse.json(
      { error: 'Failed to update communications' },
      { status: 500 }
    );
  }
}