// src/app/api/v1/_middleware.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function validateApiKey(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse('Missing API key', { status: 401 });
    }

    const apiKey = authHeader.split(' ')[1];
    
    // Find user by API key
    const user = await prisma.user.findUnique({
      where: { apiKey },
      select: { id: true, apiUsage: true, apiLimit: true }
    });

    if (!user) {
      return new NextResponse('Invalid API key', { status: 401 });
    }

    if (user.apiUsage >= user.apiLimit) {
      return new NextResponse('API limit exceeded', { status: 429 });
    }

    // Increment usage
    await prisma.user.update({
      where: { id: user.id },
      data: { apiUsage: { increment: 1 } }
    });

    return null; // Indicates successful validation
  } catch (error) {
    console.error('API auth error:', error);
    return new NextResponse('Authentication failed', { status: 500 });
  }
}