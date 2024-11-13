// src/app/(auth)/dashboard/communications/email/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { CommunicationsList } from '../components/communications-list';

export default async function EmailCommunicationsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  return <CommunicationsList type="EMAIL" />;
}