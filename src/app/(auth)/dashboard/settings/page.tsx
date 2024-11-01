import { auth } from '@clerk/nextjs/server'
import { redirect } from "next/navigation";
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences",
}

export default async function SettingsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      <p className="text-muted-foreground">Manage your account and preferences</p>
    </div>
  );
}