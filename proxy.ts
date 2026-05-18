import { NextResponse, type NextRequest } from 'next/server';

import { ADMIN_COOKIE_NAME, verifyAdminCookie } from '@/lib/auth';

/**
 * Edge-gate for the admin surface.
 *
 * The page-level `requireAdmin()` check still runs as defence-in-depth; this
 * proxy just stops unauthenticated requests from spending a render before the
 * redirect. It runs on the Node.js runtime in Next 16, so `node:crypto` (used
 * by `verifyAdminCookie`'s HMAC validation) works without extra config.
 *
 * Routes covered by the matcher below:
 *   /admin                 → settings (gated)
 *   /admin/bookings        → bookings list (gated)
 *   /admin/login           → public; redirects authenticated users away from
 *                            here is handled inside the page itself
 *   /admin/logout          → public action handler; needs no gate
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip the public admin endpoints.
  if (pathname === '/admin/login' || pathname === '/admin/logout') {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (verifyAdminCookie(cookie)) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/admin/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Match the admin surface, but exclude login/logout via the `proxy` function
  // above. Including them in the matcher and excluding inside the function
  // keeps the regex simple and readable.
  matcher: ['/admin', '/admin/:path*'],
};
