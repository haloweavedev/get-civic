// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
  '/api/auth/(.*)',
  '/api/integrations/(.*)',
  '/api/test-call',
  ...(process.env.NODE_ENV === 'development' ? ['/api/test(.*)'] : []),
]);

// Create performance monitoring middleware
function addPerformanceHeaders(request: NextRequest, response: NextResponse) {
  const startTime = Date.now();
  
  // Add Server-Timing header
  response.headers.set(
    'Server-Timing',
    `route;dur=${Date.now() - startTime};desc="${request.nextUrl.pathname}"`
  );

  // Add custom performance headers
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
  response.headers.set('X-Route-Path', request.nextUrl.pathname);

  return response;
}

// Combined middleware function
async function performanceMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Skip performance monitoring for static assets
  if (!request.nextUrl.pathname.includes('_next/static')) {
    return addPerformanceHeaders(request, response);
  }
  
  return response;
}

// Export combined middleware
export default clerkMiddleware((auth, request) => {
  // Skip auth for public routes
  if (isPublicRoute(request)) {
    return performanceMiddleware(request as NextRequest);
  }

  // For protected routes, add performance headers after auth
  const response = NextResponse.next();
  return addPerformanceHeaders(request as NextRequest, response);
});

// Keep existing config
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/|robots.txt|sitemap.xml).*)',
    '/api/:path*',
  ],
};