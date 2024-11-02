// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define public routes with more specific patterns
const isPublicRoute = createRouteMatcher([
  // Public pages
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  
  // Webhook endpoints (Twilio and Gmail)
  '/api/webhooks/twilio/(.*)',  // Twilio webhooks
  '/api/webhooks/gmail/(.*)',   // Gmail webhooks
  
  // Integration auth endpoints
  '/api/integrations/gmail/callback',  // Gmail OAuth callback
  '/api/integrations/gmail/auth',      // Gmail auth initiation
  '/api/integrations/twilio/callback', // Twilio verification (if needed)
  
  // Test endpoints (secure these in production)
  ...(process.env.NODE_ENV === 'development' ? [
    '/api/test(.*)',
    '/api/test-call',
  ] : [])
])

// Define routes that require admin access
const isAdminRoute = createRouteMatcher([
  '/dashboard/api(.*)',         // API management
  '/dashboard/settings(.*)',    // Global settings
  '/dashboard/analytics(.*)'    // Advanced analytics
])

export default clerkMiddleware(async (auth, request) => {
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${new Date().toISOString()}] Request to: ${request.url}`)
  }

  // Handle public routes
  if (isPublicRoute(request)) {
    return
  }

  // Protect all other routes
  const { userId, sessionClaims } = await auth.protect()

  // Check admin access for admin routes
  if (isAdminRoute(request)) {
    const isAdmin = (sessionClaims?.metadata as { role?: string })?.role === 'admin'
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required')
    }
  }

  // Attach user context for logging/monitoring
  request.headers.set('X-User-Id', userId)
}, {
  debug: process.env.NODE_ENV === 'development',
  // Optional: publishableKey if needed for client-side features
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
})

export const config = {
  matcher: [
    /*
      - Match all request paths except for the ones starting with:
        - _next/static (static files)
        - _next/image (image optimization files)
        - favicon.ico (favicon file)
        - public folder files
      - Optionally: add api routes that should be public
    */
    "/((?!_next/static|_next/image|favicon.ico|public/|robots.txt|sitemap.xml).*)",
    
    // Always run middleware for API routes
    "/api/:path*"
  ]
}