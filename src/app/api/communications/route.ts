// src/app/api/communications/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const communications = await prisma.communication.findMany({
      where: {
        userId,
        ...(type && type !== 'all' ? { type } : {}),
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      include: {
        analysis: true
      }
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