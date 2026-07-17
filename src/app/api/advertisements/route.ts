import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import { getToken } from 'next-auth/jwt';

export const dynamic = 'force-dynamic';

// Possible NextAuth cookie names to try
const NEXTAUTH_COOKIE_NAMES = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  'session',
];

// GET - Get active advertisements for current user/agency
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();

    // 1. Try to find the NextAuth session cookie with multiple possible names
    let sessionToken: string | undefined;
    for (const cookieName of NEXTAUTH_COOKIE_NAMES) {
      const cookie = cookieStore.get(cookieName);
      if (cookie?.value) {
        sessionToken = cookie.value;
        break;
      }
    }

    // 2. If a session cookie was found, decode the JWT to get user info
    if (sessionToken) {
      try {
        const token = await getToken({
          req,
          secret: process.env.NEXTAUTH_SECRET || 'qrtags-secret-key-change-in-production',
        });

        if (token) {
          const user = {
            id: token.sub as string,
            role: token.role as string,
            agencyId: token.agencyId as string | null,
          };

          return NextResponse.json({
            advertisements: await getAdvertisements(user),
          });
        }
      } catch {
        // JWT decode failed, fall through to db.session lookup
      }
    }

    // 3. Fallback: look up the session using the db.session table directly
    // Try to find the most recent active session (not expired)
    const activeSession = await db.session.findFirst({
      where: {
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActivity: 'desc' },
      include: { user: true },
    });

    if (activeSession) {
      const user = activeSession.user;
      return NextResponse.json({
        advertisements: await getAdvertisements(user),
      });
    }

    return NextResponse.json({ advertisements: [] });
  } catch (error) {
    console.error('Error fetching active advertisements:', error);
    return NextResponse.json({ advertisements: [] });
  }
}

async function getAdvertisements(user: { id: string; role: string; agencyId: string | null }) {
  const now = new Date();

  // Get all active advertisements and filter in JS for simplicity
  const allAds = await db.advertisement.findMany({
    where: {
      status: 'active',
      startDate: { lte: now },
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 10,
  });

  // Filter by date and targeting
  const advertisements = allAds
    .filter((ad) => {
      // Check end date
      if (ad.endDate && new Date(ad.endDate) < now) {
        return false;
      }

      // Check targeting
      if (ad.targetScope === 'all') {
        return true;
      }

      if (ad.targetScope === 'agency' && ad.agencyId === user.agencyId) {
        return true;
      }

      if (ad.targetScope === 'agents' && user.role === 'agent') {
        return true;
      }

      return false;
    })
    .slice(0, 5);

  return advertisements;
}
