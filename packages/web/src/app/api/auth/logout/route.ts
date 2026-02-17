import { NextRequest, NextResponse } from 'next/server';

// Auth cookie name
const AUTH_COOKIE = 'ahq_auth';

/**
 * Logout route handler
 * Clears the auth cookie and redirects to login
 */
export async function POST() {
  // Clear the auth cookie
  const response = NextResponse.json({ success: true });

  response.cookies.set({
    name: AUTH_COOKIE,
    value: '',
    expires: new Date(0),
    path: '/',
  });

  return response;
}

/**
 * Also support GET for logout (redirects to login)
 */
export async function GET(request: NextRequest) {
  // Clear the auth cookie and redirect to login
  const response = NextResponse.redirect(new URL('/login', request.url));

  response.cookies.set({
    name: AUTH_COOKIE,
    value: '',
    expires: new Date(0),
    path: '/',
  });

  return response;
}
