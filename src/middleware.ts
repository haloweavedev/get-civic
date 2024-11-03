// src/middleware.ts

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
  '/api/integrations/(.*)',
  '/api/test-call',
  ...(process.env.NODE_ENV === 'development' ? ['/api/test(.*)'] : []),
]);

export default clerkMiddleware(async (auth, request) => {
  // Skip auth for public routes
  if (isPublicRoute(request)) {
    return;
  }

  // Protect all other routes
  const { userId } = await auth.protect();

  // Add request context
  request.headers.set('X-User-Id', userId);
}, {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, // Ensure this is set
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/|robots.txt|sitemap.xml).*)',
    '/api/:path*',
  ],
};
