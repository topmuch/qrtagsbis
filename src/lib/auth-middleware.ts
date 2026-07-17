import { NextRequest, NextResponse } from 'next/server';
import { getSession, SessionUser } from '@/lib/session';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/api/admin',
  '/api/agency',
  '/api/baggage',
  '/api/agency/tags',
  '/api/agency/wallet',
  '/api/agency/activations',
  '/api/reports',
  '/api/notifications',
  '/api/messages',
];

// Routes that require specific roles
const ROLE_RESTRICTED_ROUTES: Record<string, 'superadmin' | 'agency'> = {
  '/api/admin': 'superadmin',
  '/api/agency': 'agency',
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/auth',
  '/api/scan',
  '/api/activate',
  '/api/tags',
  '/api/detect-country',
  '/api/cron',
  '/api/init-demo',
];

/**
 * Check if a route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  // Check if it's a public route
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return false;
  }

  // Check if it matches protected routes
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Get required role for a route
 */
function getRequiredRole(pathname: string): 'superadmin' | 'agency' | null {
  for (const [route, role] of Object.entries(ROLE_RESTRICTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      return role;
    }
  }
  return null;
}

/**
 * Middleware to protect API routes
 * Use in route handlers or as global middleware
 */
export async function withAuth(
  request: NextRequest,
  handler: (user: SessionUser) => Promise<NextResponse>
): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  // Skip auth for non-protected routes
  if (!isProtectedRoute(pathname)) {
    // For public routes, we pass null user
    return handler(null as unknown as SessionUser);
  }

  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { error: 'Non autorisé - Connexion requise' },
        { status: 401 }
      );
    }

    // Check role restrictions
    const requiredRole = getRequiredRole(pathname);
    if (requiredRole && user.role !== requiredRole) {
      return NextResponse.json(
        { error: 'Accès interdit - Permissions insuffisantes' },
        { status: 403 }
      );
    }

    return handler(user);
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { error: 'Erreur d\'authentification' },
      { status: 500 }
    );
  }
}

/**
 * Higher-order function to wrap API route handlers with auth
 *
 * Usage:
 * export const GET = withAuthHandler(async (request, user) => {
 *   // user is guaranteed to be authenticated
 *   return NextResponse.json({ data: '...' });
 * });
 */
export function withAuthHandler(
  handler: (request: NextRequest, user: SessionUser) => Promise<NextResponse>,
  options?: { requiredRole?: 'superadmin' | 'agency' }
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const pathname = request.nextUrl.pathname;

    // Skip auth for non-protected routes
    if (!isProtectedRoute(pathname)) {
      return handler(request, null as unknown as SessionUser);
    }

    try {
      const user = await getSession();

      if (!user) {
        return NextResponse.json(
          { error: 'Non autorisé - Connexion requise' },
          { status: 401 }
        );
      }

      // Check role restrictions
      const requiredRole = options?.requiredRole || getRequiredRole(pathname);
      if (requiredRole && user.role !== requiredRole) {
        return NextResponse.json(
          { error: 'Accès interdit - Permissions insuffisantes' },
          { status: 403 }
        );
      }

      return handler(request, user);
    } catch (error) {
      console.error('Auth handler error:', error);
      return NextResponse.json(
        { error: 'Erreur d\'authentification' },
        { status: 500 }
      );
    }
  };
}

/**
 * Utility to get current user in API routes
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  return getSession();
}

/**
 * Utility to require authentication in API routes
 * Throws an error if not authenticated
 */
export async function requireAuthApi(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

/**
 * Utility to require specific role in API routes
 * Throws an error if not authorized
 */
export async function requireRoleApi(role: 'superadmin' | 'agency'): Promise<SessionUser> {
  const user = await requireAuthApi();
  if (user.role !== role) {
    throw new Error('FORBIDDEN');
  }
  return user;
}
