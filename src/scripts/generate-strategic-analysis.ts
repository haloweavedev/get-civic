// src/scripts/generate-strategic-analysis.ts
import { prisma } from '@/lib/prisma';
import { InsightsAnalysisService } from '@/lib/services/insights-analysis';
import type { CategoryData } from '@/types/dashboard';

async function generateStrategicAnalysis() {
  try {
    const userId = 'user_2oJI9IaKIpeRiMh8bSdFMhYWuKg'; // Replace with the appropriate user ID

    // Get data for new analysis
    const [rawCategories, communications] = await Promise.all([
      prisma.analysis.groupBy({
        by: ['categories'],
        _count: {
          categories: true,
        },
        where: {
          communication: {
            userId,
          },
        },
      }),
      prisma.communication.findMany({
        where: {
          userId,
          status: 'PROCESSED',
          analysis: {
            priority: { gte: 4 },
          },
        },
        include: { analysis: true },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
    ]);

    // Transform raw categories to CategoryData format
    const categories: CategoryData[] = rawCategories.map((category) => ({
      name: category.categories as unknown as string,
      count: category._count.categories,
      percentage: 0, // You'll need to calculate this separately
      communications: [], // Add the relevant communications here
    }));

    // Generate and save strategic analysis
    const analysis = await InsightsAnalysisService.generateAndSaveAnalysis(
      userId,
      categories,
      communications
    );

    console.log('Strategic analysis generated and saved:', analysis);
  } catch (error) {
    console.error('Error generating strategic analysis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateStrategicAnalysis();