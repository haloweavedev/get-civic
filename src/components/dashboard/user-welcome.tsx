'use client'
import { useUser } from '@clerk/nextjs'

export default function UserWelcome() {
  const { isLoaded, isSignedIn, user } = useUser()

  if (!isLoaded || !isSignedIn) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight">
        Welcome, {user.firstName || 'User'}
      </h2>
      <p className="text-muted-foreground">Your communication analytics overview</p>
    </div>
  );
}