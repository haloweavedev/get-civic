// src/app/api/auth/api-key/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a random API key
    const apiKey = crypto.randomBytes(32).toString('hex');

    // Save to database
    await prisma.user.update({
      where: { id: userId },
      data: { apiKey }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API key generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate API key' },
      { status: 500 }
    );
  }
}