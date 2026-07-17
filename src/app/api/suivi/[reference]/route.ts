/**
 * API Route — Suivi Bagage (Public, lecture seule)
 *
 * GET /api/suivi/[reference]
 *
 * Retourne les informations de suivi pour un bagage :
 *   - Infos du bagage (référence, statut, voyage, etc.)
 *   - 5 derniers scans (avec contexte, lieu, date)
 *   - Infos du dernier trouveur (nom + téléphone EN ENTIER)
 *
 * SÉCURITÉ — Données JAMAIS exposées :
 *   ❌ Email du propriétaire
 *   ❌ Numéro WhatsApp du propriétaire
 *   ❌ Coordonnées GPS brutes du trouveur
 *   ❌ IP du scanner
 *
 * Données exposées :
 *   ✅ Nom du trouveur (volontairement partagé)
 *   ✅ Téléphone du trouveur (volontairement partagé)
 *   ✅ Ville / Pays du scan (approximatif)
 *   ✅ Adresse textuelle (approximative)
 *   ✅ Contexte du scan
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logMetric } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════
//  GET HANDLER
// ═══════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const startTime = Date.now();

  try {
    const { reference } = await params;

    // ─── Rate limiting (10 req/min par référence) ───
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip')?.trim() ||
      'unknown';

    if (rateLimit(`suivi:${reference}:${clientIp}`, { windowMs: 60_000, maxRequests: 10 })) {
      return NextResponse.json(
        { status: 'error', message: 'Trop de requêtes. Réessayez dans une minute.' },
        { status: 429 }
      );
    }

    // ─── Récupérer le bagage ───
    const baggage = await db.baggage.findUnique({
      where: { reference },
      include: { agency: true },
    });

    if (!baggage) {
      return NextResponse.json({
        status: 'not_found',
        message: 'Bagage non trouvé.',
      });
    }

    // ─── Vérifier le statut ───
    if (baggage.status === 'pending_activation') {
      return NextResponse.json({
        status: 'pending_activation',
        message: 'Ce bagage n\'est pas encore activé.',
      });
    }

    if (baggage.status === 'blocked') {
      return NextResponse.json({
        status: 'blocked',
        message: 'Ce bagage a été bloqué.',
      });
    }

    // ─── Récupérer les 5 derniers scans ───
    const scanLogs = await db.scanLog.findMany({
      where: { baggageId: baggage.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        city: true,
        country: true,
        location: true,
        latitude: true,
        longitude: true,
        context: true,
        finderName: true,
        finderPhone: true,
        message: true,
        createdAt: true,
        // Exposé pour le suivi du statut WhatsApp
        whatsappStatus: true,
      },
    });

    // ─── Mapper les scans (sans données sensibles) ───
    const mappedScans = scanLogs.map((scan) => ({
      id: scan.id,
      location: scan.location || scan.city || null,
      city: scan.city || null,
      country: scan.country || null,
      context: scan.context || 'static_location',
      finderName: scan.finderName || null,
      finderPhone: scan.finderPhone || null,
      message: scan.message || null,
      // Approximation de l'adresse pour la carte (pas de GPS brut)
      hasMap: !!(scan.latitude && scan.longitude),
      // Coordinates for interactive map trajectory
      latitude: scan.latitude,
      longitude: scan.longitude,
      // Formater la date côté serveur
      scannedAt: scan.createdAt.toISOString(),
      whatsappStatus: scan.whatsappStatus || null,
    }));

    // ─── Dernier scan avec infos trouveur ───
    const lastScanWithFinder = scanLogs.find(
      (s) => s.finderName || s.finderPhone
    );

    // ─── Construire la réponse ───
    const isDeclaredLost = baggage.declaredLostAt && !baggage.foundAt;
    const isExpired = baggage.expiresAt && new Date() > baggage.expiresAt;

    const response = {
      status: isExpired ? 'expired' : isDeclaredLost ? 'lost' : 'active',
      // TRANSPORT-FEATURE: Include transportMode + conditional fields
      baggage: {
        reference: baggage.reference,
        type: baggage.type,
        travelerName: `${baggage.travelerFirstName || ''} ${baggage.travelerLastName || ''}`.trim(),
        baggageIndex: baggage.baggageIndex,
        baggageType: baggage.baggageType,
        status: baggage.status,
        transportMode: baggage.transportMode || 'flight',
        airlineName: baggage.airlineName || null,
        flightNumber: baggage.flightNumber || null,
        trainCompany: baggage.trainCompany || null,
        trainNumber: baggage.trainNumber || null,
        shipName: baggage.shipName || null,
        shipCabin: baggage.shipCabin || null,
        busCompany: baggage.busCompany || null,
        busLineNumber: baggage.busLineNumber || null,
        destination: baggage.destination || null,
        departureDate: baggage.departureDate?.toISOString() || null,
        departureTime: baggage.departureTime || null,
        agency: baggage.agency?.name || null,
        createdAt: baggage.createdAt?.toISOString() || null,
        lastScanDate: baggage.lastScanDate?.toISOString() || null,
        lastLocation: baggage.lastLocation || null,
        declaredLostAt: baggage.declaredLostAt?.toISOString() || null,
        foundAt: baggage.foundAt?.toISOString() || null,
        expiresAt: baggage.expiresAt?.toISOString() || null,
      },
      // Dernier trouveur (nom + téléphone EN ENTIER)
      lastFinder: lastScanWithFinder
        ? {
            name: lastScanWithFinder.finderName || null,
            phone: lastScanWithFinder.finderPhone || null,
          }
        : null,
      // Historique des scans (max 5)
      scans: mappedScans,
      // Dernière position pour la carte
      lastPosition: scanLogs.length > 0
        ? {
            latitude: scanLogs[0].latitude,
            longitude: scanLogs[0].longitude,
            address: scanLogs[0].location || scanLogs[0].city || null,
            hasCoordinates: !!(scanLogs[0].latitude && scanLogs[0].longitude),
          }
        : null,
    };

    const latencyMs = Date.now() - startTime;
    logMetric('suivi', 'get', latencyMs, true, {
      key: reference,
      details: `scans=${scanLogs.length}, hasFinder=${!!lastScanWithFinder}`,
    });

    return NextResponse.json(response);

  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Erreur serveur';

    logMetric('suivi', 'get', latencyMs, false, {
      key: 'error',
      details: message,
    });

    console.error('[Suivi API] Erreur:', message);
    return NextResponse.json(
      { status: 'error', message: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
