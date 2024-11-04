// src/app/(auth)/dashboard/api/page.tsx

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ApiDashboard from '@/components/dashboard/api/api-dashboard';

export default async function ApiPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      apiKey: true,
      apiUsage: true,
      apiLimit: true
    }
  });

  return <ApiDashboard user={user} />;
}