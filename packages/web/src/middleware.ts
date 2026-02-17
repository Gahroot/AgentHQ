import { NextRequest, NextResponse } from 'next/server';

// Paths that don't require authentication
const publicPaths = ['/login', '/register'];

// Paths that should redirect authenticated users to dashboard
const authPaths = ['/login', '/register'];

// Auth cookie name (set by auth store)
const AUTH_COOKIE = 'ahq_auth';

/**
 * Next.js middleware for route protection
 * - Redirects unauthenticated users from protected routes to /login
 * - Redirects authenticated users from auth pages to dashboard
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if user has an auth session (via cookie)
  const hasAuthCookie = request.cookies.get(AUTH_COOKIE)?.value === '1';
  const isAuthenticated = hasAuthCookie;

  // Check if the path is public (doesn't require auth)
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  // Allow public paths
  if (isPublicPath) {
    // If user is already authenticated and trying to access auth pages, redirect to dashboard
    if (isAuthenticated && isAuthPath) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Protect dashboard routes
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * Configure which paths the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
