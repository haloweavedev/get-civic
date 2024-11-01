'use client'
import { useAuth, useUser } from '@clerk/nextjs'

export default function UserInfo() {
  const { isLoaded: authLoaded, userId, sessionId } = useAuth()
  const { isLoaded: userLoaded, isSignedIn, user } = useUser()

  if (!authLoaded || !userLoaded) {
    return <div>Loading...</div>
  }

  if (!isSignedIn) {
    return null
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-medium">User Information</h3>
      <div className="mt-2 space-y-2 text-sm">
        <p>User ID: {userId}</p>
        <p>Session: {sessionId}</p>
        <p>Name: {user.firstName} {user.lastName}</p>
        <p>Email: {user.primaryEmailAddress?.emailAddress}</p>
      </div>
    </div>
  )
}