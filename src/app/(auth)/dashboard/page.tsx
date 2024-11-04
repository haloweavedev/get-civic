// src/app/(auth)/dashboard/page.tsx

import { auth } from '@clerk/nextjs/server';
import { redirect } from "next/navigation";
import { prisma } from '@/lib/prisma';
import DashboardContent from '@/components/dashboard/dashboard-content';

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Try to find user
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  // If no user found, redirect to sync
  if (!user) {
    const syncUrl = `/api/auth/sync?redirect=/dashboard`;
    redirect(syncUrl);
  }

  return (
    <div className="space-y-8">
      <DashboardContent userId={userId} />
    </div>
  );
}