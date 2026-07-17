import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

// ─── GET /api/loss-detection/check — Cron-callable proactive loss detection ───
//
// Finds active baggages where:
//   1. departureDate + 3h (reasonable travel time) has passed
//   2. No scans in the last 6 hours after the estimated arrival window
//   3. No existing non-dismissed LossAlert
// Creates LossAlert records for matching baggages.

const TRAVEL_TIME_HOURS = 3;
const SCAN_CHECK_HOURS = 6;
const CRON_WINDOW_MS = 300_000; // 5 min — only allow 1 call per 5 min

export async function GET(request: NextRequest) {
  try {
    // ── Cron / internal protection ──
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is set, require it
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Rate limit to prevent abuse regardless of secret
    if (rateLimit('loss-detection:check', { windowMs: CRON_WINDOW_MS, maxRequests: 1 })) {
      return NextResponse.json(
        { error: 'Trop de demandes. La détection est déjà en cours.' },
        { status: 429 }
      );
    }

    const now = new Date();

    // ── 1. Find candidate baggages ──
    // Active or scanned, with a departureDate set, not lost/found/blocked
    const candidates = await db.baggage.findMany({
      where: {
        status: { in: ['active', 'scanned'] },
        departureDate: { not: null },
      },
      select: {
        id: true,
        reference: true,
        departureDate: true,
        status: true,
      },
    });

    if (candidates.length === 0) {
      return NextResponse.json({ alertsCreated: 0, message: 'Aucun bagage candidat.' });
    }

    // ── 2. Filter & create alerts ──
    let alertsCreated = 0;

    for (const baggage of candidates) {
      const departure = new Date(baggage.departureDate!);
      // Estimated arrival window: departureDate + TRAVEL_TIME_HOURS
      const arrivalWindow = new Date(departure.getTime() + TRAVEL_TIME_HOURS * 60 * 60 * 1000);

      // If arrival window hasn't passed yet, skip
      if (now <= arrivalWindow) continue;

      // Check for any scan after the arrival window
      const recentScan = await db.scanLog.findFirst({
        where: {
          baggageId: baggage.id,
          createdAt: { gte: arrivalWindow },
        },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
      });

      // If there is a scan within the window, skip
      if (recentScan) continue;

      // Check if a non-dismissed alert already exists
      const existingAlert = await db.lossAlert.findFirst({
        where: {
          baggageId: baggage.id,
          dismissed: false,
        },
        select: { id: true },
      });

      if (existingAlert) continue;

      // ── Create the LossAlert ──
      const timeSinceArrival = now.getTime() - arrivalWindow.getTime();
      const hoursSinceArrival = Math.round(timeSinceArrival / (1000 * 60 * 60) * 10) / 10;

      await db.lossAlert.create({
        data: {
          baggageId: baggage.id,
          reference: baggage.reference,
          alertType: 'no_scan_after_arrival',
          message: `Aucun scan détecté depuis ${hoursSinceArrival}h après la fenêtre d'arrivée estimée (départ: ${departure.toISOString()}). Le bagage ${baggage.reference} pourrait être perdu.`,
        },
      });

      alertsCreated++;
    }

    return NextResponse.json({
      alertsCreated,
      candidatesChecked: candidates.length,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Error in loss detection check:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la détection de perte.' },
      { status: 500 }
    );
  }
}