import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths to exclude from authentication
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/'
  ) {
    // If user has a valid token and tries to access login/register, redirect them to their portal
    const token = request.cookies.get('token')?.value;
    if (token && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          if (payload.role === 'BORROWER') {
            return NextResponse.redirect(new URL('/portal', request.url));
          } else {
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }
        }
      } catch (e) {
        // Ignore parsing errors for redirect
      }
    }
    return NextResponse.next();
  }

  const tokenCookie = request.cookies.get('token');
  const token = tokenCookie?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Decode JWT token payload
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decodedPayload = atob(payloadBase64);
    const user = JSON.parse(decodedPayload);

    const { role } = user;

    // Route Guards
    if (pathname.startsWith('/portal')) {
      if (role !== 'BORROWER') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    if (pathname.startsWith('/dashboard')) {
      const dashboardRoles = ['ADMIN', 'SALES', 'SANCTION', 'DISBURSEMENT', 'COLLECTION'];
      if (!dashboardRoles.includes(role)) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      if (pathname.startsWith('/dashboard/sales') && role !== 'SALES' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      if (pathname.startsWith('/dashboard/sanction') && role !== 'SANCTION' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      if (pathname.startsWith('/dashboard/disbursement') && role !== 'DISBURSEMENT' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      if (pathname.startsWith('/dashboard/collection') && role !== 'COLLECTION' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware JWT parsing error:', error);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
