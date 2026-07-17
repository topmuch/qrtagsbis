import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

/**
 * GET /api/checklist/[code]?key=XXX
 *
 * Public endpoint — returns checklist metadata + items IF the verification key matches.
 * Used by the /checklist/[code] public page to display the attestation.
 *
 * Query params:
 *   key — 8-char verification key (required to view full content)
 *
 * Without key: returns only public metadata (firstName, code, createdAt) so the page
 * can show the "Enter verification key" prompt without leaking data.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const url = new URL(request.url);
    const providedKey = url.searchParams.get('key')?.trim();

    // ─── Rate limit: 30 views / hour / IP per code ───
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip')?.trim() ||
      'unknown';
    if (rateLimit(`checklist-view:${code}:${clientIp}`, { windowMs: 60 * 60 * 1000, maxRequests: 30 })) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez plus tard.' },
        { status: 429 }
      );
    }

    const checklist = await db.checklist.findUnique({
      where: { code: code.toUpperCase() },
      select: {
        id: true,
        code: true,
        verificationKey: true,
        firstName: true,
        lastName: true,
        email: true,
        departureDate: true,
        destinationCountry: true,
        airline: true,
        items: true,
        itemsCount: true,
        photoPath: true,
        pdfSizeBytes: true,
        emailSent: true,
        viewCount: true,
        createdAt: true,
      },
    });

    if (!checklist) {
      return NextResponse.json(
        { status: 'not_found', message: 'Attestation introuvable' },
        { status: 404 }
      );
    }

    // ─── Without key → return only minimal public metadata ───
    if (!providedKey) {
      return NextResponse.json({
        status: 'locked',
        code: checklist.code,
        firstName: checklist.firstName,
        createdAt: checklist.createdAt.toISOString(),
        itemsCount: checklist.itemsCount,
      });
    }

    // ─── Verify key (constant-time-ish compare) ───
    if (providedKey !== checklist.verificationKey) {
      // Rate limit wrong attempts more aggressively
      if (rateLimit(`checklist-wrong:${code}:${clientIp}`, { windowMs: 60 * 60 * 1000, maxRequests: 10 })) {
        return NextResponse.json(
          { status: 'locked', error: 'Trop de tentatives incorrectes. Réessayez plus tard.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { status: 'locked', error: 'Clé de vérification incorrecte' },
        { status: 403 }
      );
    }

    // ─── Increment view count (fire-and-forget) ───
    db.checklist.update({
      where: { id: checklist.id },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    }).catch(() => {});

    // ─── Return full content ───
    let parsedItems: unknown = [];
    try {
      parsedItems = JSON.parse(checklist.items);
    } catch {
      parsedItems = [];
    }

    return NextResponse.json({
      status: 'unlocked',
      code: checklist.code,
      firstName: checklist.firstName,
      lastName: checklist.lastName,
      email: checklist.email,
      departureDate: checklist.departureDate,
      destinationCountry: checklist.destinationCountry,
      airline: checklist.airline,
      items: parsedItems,
      itemsCount: checklist.itemsCount,
      hasPhoto: !!checklist.photoPath,
      pdfSizeBytes: checklist.pdfSizeBytes,
      emailSent: checklist.emailSent,
      viewCount: checklist.viewCount,
      createdAt: checklist.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('[checklist/[code]] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
