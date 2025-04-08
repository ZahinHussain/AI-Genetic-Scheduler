import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that require authentication
const PROTECTED_PATHS = ['/home', '/profile', '/schedule', '/projects'];
// Paths that are only accessible to non-authenticated users
const AUTH_PATHS = ['/signin', '/signup', '/reset-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if this is a protected path
  const isProtectedPath = PROTECTED_PATHS.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // Check if this is an auth path (login, signup, etc.)
  const isAuthPath = AUTH_PATHS.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // Get auth token from cookies
  const authCookie = request.cookies.get('auth_token');
  const isAuthenticated = !!authCookie?.value;
  
  // Handle protected routes - redirect to login if not authenticated
  if (isProtectedPath && !isAuthenticated) {
    const redirectUrl = new URL('/signin', request.url);
    // Add the original url as a parameter to redirect back after login
    redirectUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Handle auth routes - redirect to home if already authenticated
  if (isAuthPath && isAuthenticated) {
    return NextResponse.redirect(new URL('/home', request.url));
  }
  
  // For root path, redirect authenticated users to home
  if (pathname === '/' && isAuthenticated) {
    return NextResponse.redirect(new URL('/home', request.url));
  }
  
  return NextResponse.next();
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /static (public files)
     * 4. all root files like favicon.ico, robots.txt, etc.
     */
    '/((?!api|_next|static|favicon.ico|robots.txt).*)',
  ],
};
