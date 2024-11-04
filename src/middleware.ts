// src/middleware.ts

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
  '/api/auth/(.*)',      // Added to allow auth routes
  '/api/integrations/(.*)',
  '/api/test-call',
  ...(process.env.NODE_ENV === 'development' ? ['/api/test(.*)'] : []),
]);

export default clerkMiddleware((auth, request) => {
  // Skip auth for public routes
  if (isPublicRoute(request)) {
    return;
  }
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/|robots.txt|sitemap.xml).*)',
    '/api/:path*',
  ],
};