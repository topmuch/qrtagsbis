import { cookies, headers } from 'next/headers';
import { db } from '@/lib/db';
import { LoginLog, Session } from '@prisma/client';

// Session duration: 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_COOKIE_NAME = 'qrtags_session';

// Inactivity timeout: 24 hours (session expires if no activity)
const INACTIVITY_TIMEOUT_MS = 24 * 60 * 60 * 1000;

// User with agency info for the session
export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  agencyId: string | null;
  agency?: {
    id: string;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  } | null;
}

// Login log entry for audit
export interface LoginLogEntry {
  id: string;
  userId: string | null;
  email: string;
  success: boolean;
  failureReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  country: string | null;
  city: string | null;
  createdAt: Date;
}

/**
 * Get client IP address from headers
 */
async function getClientIp(): Promise<string | null> {
  try {
    const headersList = await headers();
    return (
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      headersList.get('cf-connecting-ip') || // Cloudflare
      null
    );
  } catch {
    return null;
  }
}

/**
 * Get user agent from headers
 */
async function getUserAgent(): Promise<string | null> {
  try {
    const headersList = await headers();
    return headersList.get('user-agent');
  } catch {
    return null;
  }
}

/**
 * Log a login attempt
 */
export async function logLoginAttempt(params: {
  userId?: string;
  email: string;
  success: boolean;
  failureReason?: string;
}): Promise<LoginLog> {
  const ipAddress = await getClientIp();
  const userAgent = await getUserAgent();

  return db.loginLog.create({
    data: {
      userId: params.userId || null,
      email: params.email.toLowerCase(),
      success: params.success,
      failureReason: params.failureReason || null,
      ipAddress,
      userAgent,
    },
  });
}

/**
 * Create a new session for a user
 * Sets an HTTP-only cookie with the session ID
 */
export async function createSession(userId: string): Promise<Session> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const ipAddress = await getClientIp();
  const userAgent = await getUserAgent();

  // Create session in database with metadata
  const session = await db.session.create({
    data: {
      userId,
      expiresAt,
      ipAddress,
      userAgent,
      lastActivity: new Date(),
    },
  });

  // Set HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return session;
}

/**
 * Get the current session from the cookie
 * Returns the user if session is valid, null otherwise
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionId) {
      return null;
    }

    // Find session with user data
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          include: {
            agency: {
              select: {
                id: true,
                name: true,
                slug: true,
                email: true,
                phone: true,
                address: true,
              },
            },
          },
        },
      },
    });

    // Session not found
    if (!session) {
      // Clear invalid cookie
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }

    // Session expired by date
    if (session.expiresAt < new Date()) {
      // Delete expired session
      await db.session.delete({ where: { id: sessionId } });
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }

    // Session expired by inactivity (24 hours without activity)
    const inactivityThreshold = new Date(Date.now() - INACTIVITY_TIMEOUT_MS);
    if (session.lastActivity < inactivityThreshold) {
      await db.session.delete({ where: { id: sessionId } });
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }

    // Update last activity (debounced - only update every 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (session.lastActivity < fiveMinutesAgo) {
      await db.session.update({
        where: { id: sessionId },
        data: { lastActivity: new Date() },
      });
    }

    // Return user data
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      agencyId: session.user.agencyId,
      agency: session.user.agency,
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Delete the current session
 * Removes the session from database and clears the cookie
 */
export async function deleteSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionId) {
      // Delete from database
      await db.session.delete({ where: { id: sessionId } }).catch(() => {
        // Ignore if session doesn't exist
      });
    }

    // Clear cookie
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (error) {
    console.error('Error deleting session:', error);
  }
}

/**
 * Extend the current session expiration
 */
export async function extendSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionId) {
      return false;
    }

    const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    // Update session expiration
    await db.session.update({
      where: { id: sessionId },
      data: {
        expiresAt: newExpiresAt,
        lastActivity: new Date(),
      },
    });

    // Update cookie expiration
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: newExpiresAt,
      path: '/',
    });

    return true;
  } catch (error) {
    console.error('Error extending session:', error);
    return false;
  }
}

/**
 * Clean up expired sessions (can be called periodically via cron)
 * Returns number of sessions deleted
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    // Delete sessions that have expired by date
    const expiredByDate = await db.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    // Delete sessions that have been inactive for too long
    const inactivityThreshold = new Date(Date.now() - INACTIVITY_TIMEOUT_MS);
    const expiredByInactivity = await db.session.deleteMany({
      where: {
        lastActivity: { lt: inactivityThreshold },
      },
    });

    return expiredByDate.count + expiredByInactivity.count;
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
    return 0;
  }
}

/**
 * Get all login logs (for audit page)
 */
export async function getLoginLogs(limit: number = 100): Promise<LoginLogEntry[]> {
  return db.loginLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get login logs for a specific user
 */
export async function getUserLoginLogs(userId: string, limit: number = 20): Promise<LoginLogEntry[]> {
  return db.loginLog.findMany({
    where: { userId },
    take: limit,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get active sessions count
 */
export async function getActiveSessionsCount(): Promise<number> {
  return db.session.count({
    where: {
      expiresAt: { gt: new Date() },
      lastActivity: { gt: new Date(Date.now() - INACTIVITY_TIMEOUT_MS) },
    },
  });
}

/**
 * Get all active sessions (for admin view)
 */
export async function getActiveSessions(): Promise<(Session & { user: { email: string; name: string | null; role: string } })[]> {
  return db.session.findMany({
    where: {
      expiresAt: { gt: new Date() },
      lastActivity: { gt: new Date(Date.now() - INACTIVITY_TIMEOUT_MS) },
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: { lastActivity: 'desc' },
  });
}

/**
 * Server-side function to require authentication
 * Redirects to login if not authenticated
 * Returns the user if authenticated
 */
export async function requireAuth(allowedRole?: 'superadmin' | 'agency'): Promise<SessionUser> {
  const user = await getSession();

  if (!user) {
    const loginPath = allowedRole === 'superadmin' ? '/admin/connexion' : '/agence/connexion';
    throw new Error(`REDIRECT:${loginPath}`);
  }

  if (allowedRole && user.role !== allowedRole) {
    // User has wrong role, redirect to their correct area
    if (user.role === 'superadmin') {
      throw new Error('REDIRECT:/admin/tableau-de-bord');
    } else {
      throw new Error('REDIRECT:/agence/tableau-de-bord');
    }
  }

  return user;
}
