import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// POST - Track impression or click
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { advertisementId, action } = body;

    if (!advertisementId || !action) {
      return NextResponse.json(
        { error: 'advertisementId et action requis' },
        { status: 400 }
      );
    }

    if (!['impression', 'click'].includes(action)) {
      return NextResponse.json(
        { error: 'Action doit être "impression" ou "click"' },
        { status: 400 }
      );
    }

    // Check if advertisement exists
    const ad = await db.advertisement.findUnique({
      where: { id: advertisementId }
    });

    if (!ad) {
      return NextResponse.json(
        { error: 'Publicité non trouvée' },
        { status: 404 }
      );
    }

    // Get user info if authenticated
    let userId: string | null = null;
    let agencyId: string | null = null;
    let userRole: string | null = null;

    try {
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get('session')?.value;

      if (sessionToken) {
        const session = await db.session.findUnique({
          where: { id: sessionToken },
          include: { user: true }
        });

        if (session) {
          userId = session.user.id;
          agencyId = session.user.agencyId;
          userRole = session.user.role;
        }
      }
    } catch {
      // Continue without user info
    }

    // Get IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown';
    const userAgent = request.headers.get('user-agent') || null;

    // Create impression record
    await db.adImpression.create({
      data: {
        advertisementId,
        userId,
        agencyId,
        userRole,
        action,
        ipAddress: String(ipAddress).split(',')[0].trim(),
        userAgent
      }
    });

    // Update advertisement counters
    if (action === 'impression') {
      await db.advertisement.update({
        where: { id: advertisementId },
        data: { impressions: { increment: 1 } }
      });
    } else {
      await db.advertisement.update({
        where: { id: advertisementId },
        data: { clicks: { increment: 1 } }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error tracking advertisement:', error);
    return NextResponse.json(
      { error: 'Erreur lors du tracking' },
      { status: 500 }
    );
  }
}
