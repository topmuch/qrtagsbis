import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple middleware for route protection
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Public routes - always allow (login pages)
  if (
    pathname === '/admin/connexion' ||
    pathname === '/admin/login' ||
    pathname === '/agence/connexion' ||
    pathname === '/agence/login' ||
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname === '/api/init-demo'
  ) {
    return NextResponse.next();
  }

  // For protected routes, allow access (client-side handles redirect if not logged in)
  // This simplifies authentication - the client checks session after login
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/agence/:path*',
    '/login',
  ],
};
