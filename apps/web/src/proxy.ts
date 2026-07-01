import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Route guard (Next.js 16 renamed Middleware → Proxy).
 *
 * - Unauthenticated users on a private route → redirected to `/join`.
 * - Authenticated users on `/join` → redirected to `/dashboard`.
 *
 * Public routes: `/` (landing) and `/join` (login).
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthed = !!req.auth;

  const isPublic =
    pathname === '/' || pathname === '/join' || pathname.startsWith('/join/');

  if (!isAuthed && !isPublic) {
    return NextResponse.redirect(new URL('/join', req.nextUrl));
  }

  if (isAuthed && pathname === '/join') {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Run on everything except API routes, Next internals and static files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
