// src/app/actions.ts
'use server'

import { prisma } from '@/lib/prisma';
import { AIAnalysisService } from '@/lib/services/ai-analysis';
import { revalidatePath } from 'next/cache';

export async function syncCommunications() {
  try {
    // Sync Gmail
    const response = await fetch('/api/integrations/gmail/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error('Failed to sync communications');
    }

    revalidatePath('/dashboard/insights');
    return { success: true };
  } catch (error) {
    console.error('Sync failed:', error);
    return { success: false, error: 'Failed to sync communications' };
  }
}

export async function analyzePendingCommunications() {
  try {
    const pendingComms = await prisma.communication.findMany({
      where: { status: 'PENDING' },
      select: { id: true }
    });

    if (pendingComms.length === 0) {
      return { success: true, analyzed: 0 };
    }

    const results = await AIAnalysisService.analyzeMultiple(
      pendingComms.map(comm => comm.id)
    );

    revalidatePath('/dashboard/insights');
    return { success: true, analyzed: results.success.length };
  } catch (error) {
    console.error('Analysis failed:', error);
    return { success: false, error: 'Failed to analyze communications' };
  }
}