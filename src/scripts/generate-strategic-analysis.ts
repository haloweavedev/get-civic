// src/scripts/generate-strategic-analysis.ts
import { prisma } from '@/lib/prisma';
import { InsightsAnalysisService } from '@/lib/services/insights-analysis';
import type { CategoryData } from '@/types/dashboard';

const ADMIN_EMAIL = '3advanceinsights@gmail.com';

async function generateStrategicAnalysis() {
  try {
    // Get admin user dynamically
    const user = await prisma.user.findFirst({
      where: { 
        email: ADMIN_EMAIL,
        role: 'ADMIN'
      }
    });

    if (!user) {
      throw new Error(`Admin user with email ${ADMIN_EMAIL} not found`);
    }

    // Fetch data for new analysis
    const [rawCategories, communications] = await Promise.all([
      prisma.analysis.groupBy({
        by: ['categories'],
        _count: { categories: true },
        where: { communication: { userId: user.id } },
      }),
      prisma.communication.findMany({
        where: {
          userId: user.id,
          status: 'PROCESSED',
          analysis: { priority: { gte: 4 } },
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
      percentage: 0, // Calculate this separately if needed
      communications: [], // Add the relevant communications here if needed
    }));

    // Generate and save strategic analysis
    const analysis = await InsightsAnalysisService.generateAndSaveAnalysis(
      user.id,
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