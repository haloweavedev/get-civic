// src/app/api/v1/communications/route.ts

import { NextResponse } from 'next/server';
import { validateApiKey } from '../_middleware';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  // Validate API key
  const authError = await validateApiKey(req);
  if (authError) return authError;

  try {
    const searchParams = new URL(req.url).searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const communications = await prisma.communication.findMany({
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        content: true,
        direction: true,
        createdAt: true,
        analysis: {
          select: {
            sentiment: true,
            summary: true,
            categories: true,
            priority: true
          }
        }
      }
    });

    // Remove sensitive data
    const sanitizedComms = communications.map(comm => ({
      ...comm,
      content: comm.content.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
                          .replace(/(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g, '[PHONE]')
    }));

    return NextResponse.json({
      success: true,
      data: sanitizedComms,
      pagination: {
        page,
        limit,
        hasMore: communications.length === limit
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch communications' },
      { status: 500 }
    );
  }
}