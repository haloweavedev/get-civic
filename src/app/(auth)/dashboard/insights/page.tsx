// src/app/(auth)/dashboard/insights/page.tsx

import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from '@/lib/prisma';
import InsightsDashboard from '@/components/dashboard/insights/insights-dashboard';

export default async function InsightsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // First get all communications
  const communications = await prisma.communication.findMany({
    where: {
      userId,
    },
    include: {
      analysis: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log('Total communications found:', communications.length);
  console.log('Communications with analysis:', 
    communications.filter(c => c.analysis).length
  );

  // Get status distribution
  const stats = await prisma.communication.groupBy({
    by: ['status'],
    where: { userId },
    _count: true,
  });

  console.log('Status distribution:', stats);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Communication Insights</h2>
        <p className="text-muted-foreground">
          Analysis and trends from your communications
        </p>
      </div>

      <InsightsDashboard 
        communications={communications}
        stats={stats}
      />
    </div>
  );
}