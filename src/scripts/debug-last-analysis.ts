// src/scripts/debug-last-analysis.ts
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';

async function debugLastAnalysis() {
  try {
    const lastAnalysis = await prisma.strategicAnalysis.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    if (lastAnalysis) {
      await fs.writeFile(
        './last-analysis-data.json',
        JSON.stringify(lastAnalysis, null, 2)
      );
      console.log('Last analysis data written to last-analysis-data.json');
    } else {
      console.log('No analysis data found.');
    }
  } catch (error) {
    console.error('Error retrieving last analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLastAnalysis();