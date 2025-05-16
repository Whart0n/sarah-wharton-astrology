import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Set your preview password here or use process.env for better security
const PREVIEW_PASSWORD = process.env.PREVIEW_PASSWORD || 'letmein';
const AUTH_COOKIE = 'preview_auth';
const LANDING_PAGE = '/landing';
const LOGIN_PAGE = '/login';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes, static files, login, and landing page
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === LOGIN_PAGE ||
    pathname === LANDING_PAGE
  ) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const authCookie = request.cookies.get(AUTH_COOKIE)?.value;
  if (authCookie === PREVIEW_PASSWORD) {
    return NextResponse.next();
  }

  // Not authenticated: redirect to landing or login
  if (pathname !== LOGIN_PAGE && pathname !== LANDING_PAGE) {
    return NextResponse.redirect(new URL(LANDING_PAGE, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
