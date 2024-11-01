'use client'
import { useUser } from '@clerk/nextjs'

export default function UserGreeting() {
  const { isLoaded, user } = useUser()

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  return (
    <h2 className="text-3xl font-bold tracking-tight">
      Welcome, {user?.firstName || 'User'}
    </h2>
  );
}