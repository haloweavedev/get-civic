// src/app/(auth)/dashboard/communications/sms/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { CommunicationsList } from '../components/communications-list';

export default async function SMSCommunicationsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  return <CommunicationsList type="SMS" />;
}