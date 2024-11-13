// src/app/(auth)/dashboard/categories/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CategoriesDashboard from '@/components/dashboard/categories/categories-dashboard';

export default async function CategoriesPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  // Get detailed analysis data
  const analysisData = await prisma.analysis.findMany({
    include: {
      communication: {
        select: {
          id: true,
          type: true,
          subject: true,
          from: true,
          content: true,
          createdAt: true,
          status: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return <CategoriesDashboard analysisData={analysisData} />;
}