// src/lib/auth.ts

import { auth as clerkAuth } from '@clerk/nextjs/server';

/**
 * Retrieves the authentication information for the current user.
 * @returns An object containing the userId and sessionId.
 */
export async function auth() {
  return clerkAuth();
}
