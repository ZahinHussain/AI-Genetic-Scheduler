import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes configuration
const PROTECTED_PATHS = ['/home', '/calender', '/reccuingtask', '/generation','tasks'];
const AUTH_PATHS = ['/signin', '/signup', '/reset-password'];

// Enable/disable detailed logging (set to false in production)
const ENABLE_DEBUG_LOGGING = process.env.NODE_ENV !== 'production';

/**
 * Next.js Middleware for handling authentication and route protection
 * 
 * This middleware:
 * 1. Redirects unauthenticated users away from protected routes
 * 2. Redirects authenticated users away from auth routes
 * 3. Redirects authenticated users from root to home
 */
export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const authCookie = request.cookies.get('auth_token');
    const isAuthenticated = !!authCookie?.value;

    // Debug logging
    if (ENABLE_DEBUG_LOGGING) {
      console.log(`\n--- Middleware Triggered ---`);
      console.log(`Request Path: ${pathname}`);
      console.log(`Auth Cookie Present: ${!!authCookie}`);
      console.log(`Is Authenticated: ${isAuthenticated}`);
    }

    // Check if the current path matches any of our defined path arrays
    const isProtectedPath = PROTECTED_PATHS.some(path =>
      pathname === path || pathname.startsWith(`${path}/`)
    );
    const isAuthPath = AUTH_PATHS.some(path =>
      pathname === path || pathname.startsWith(`${path}/`)
    );

    if (ENABLE_DEBUG_LOGGING) {
      console.log(`Is Protected Path: ${isProtectedPath}`);
      console.log(`Is Auth Path: ${isAuthPath}`);
    }

    // Handle routing based on authentication status and path type
    
    // Case 1: Unauthenticated user trying to access protected route
    if (isProtectedPath && !isAuthenticated) {
      if (ENABLE_DEBUG_LOGGING) {
        console.log(`Redirecting: Protected path (${pathname}) to /signin - User not authenticated`);
      }
      const redirectUrl = new URL('/signin', request.url);
      redirectUrl.searchParams.set('from', pathname); // Save original destination
      return NextResponse.redirect(redirectUrl);
    }

    // Case 2: Authenticated user trying to access auth routes
    if (isAuthPath && isAuthenticated) {
      if (ENABLE_DEBUG_LOGGING) {
        console.log(`Redirecting: Auth path (${pathname}) to /home - User already authenticated`);
      }
      return NextResponse.redirect(new URL('/home', request.url));
    }

    // Case 3: Authenticated user at root path
    if (pathname === '/' && isAuthenticated) {
      if (ENABLE_DEBUG_LOGGING) {
        console.log(`Redirecting: Root path to /home - User authenticated`);
      }
      return NextResponse.redirect(new URL('/home', request.url));
    }

    // All other cases: allow the request to proceed
    if (ENABLE_DEBUG_LOGGING) {
      console.log(`Allowing request to proceed for path: ${pathname}`);
    }
    return NextResponse.next();
    
  } catch (error) {
    // Log any errors that occur in middleware
    console.error('Middleware error:', error);
    
    // In case of error, we should still allow the request to proceed
    // instead of breaking the application
    return NextResponse.next();
  }
}

/**
 * Matcher configuration determines which paths the middleware runs on
 * Excludes static files, API routes, and other Next.js internals
 */
export const config = {
  matcher: [
    // Match all paths except those starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (optimized images)
    // - static (public static folder)
    // - favicon.ico, robots.txt and other common files
    '/((?!api|_next/static|_next/image|static|favicon.ico|robots.txt|.*\\..*).*)',
  ],
};