/**
 * API Route — Toggle Baggage Status (Public, urgence)
 *
 * POST /api/baggage-status/[reference]
 *
 * Permet au propriétaire de basculer le statut d'un bagage :
 *   - mark-lost  → status: 'lost' + declaredLostAt
 *   - mark-found → status: 'active' + foundAt
 *
 * SÉCURITÉ :
 *   - Pas d'authentification requise (urgence)
 *   - Rate limit : 5 req/min par IP
 *   - Validation Zod du body
 *   - Seuls les champs status/declaredLostAt/foundAt sont modifiés
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { logMetric } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// ─── Validation ───
const statusSchema = z.object({
  action: z.enum(['mark-lost', 'mark-found']),
});

// ═══════════════════════════════════════════════════════
//  POST HANDLER
// ═══════════════════════════════════════════════════════

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  const startTime = Date.now();

  try {
    const { reference } = await params;

    // ─── Rate limiting (5 req/min par IP) ───
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip')?.trim() ||
      'unknown';

    if (rateLimit(`baggage-status:${clientIp}`, { windowMs: 60_000, maxRequests: 5 })) {
      return NextResponse.json(
        { success: false, message: 'Trop de requêtes. Réessayez dans une minute.' },
        { status: 429 }
      );
    }

    // ─── Parser et valider le body ───
    let body: { action: 'mark-lost' | 'mark-found' };
    try {
      const raw = await request.json();
      body = statusSchema.parse(raw);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Paramètres invalides.' },
        { status: 400 }
      );
    }

    // ─── Vérifier que le bagage existe ───
    const baggage = await db.baggage.findUnique({
      where: { reference },
      select: {
        id: true,
        reference: true,
        status: true,
        declaredLostAt: true,
        foundAt: true,
      },
    });

    if (!baggage) {
      return NextResponse.json(
        { success: false, message: 'Bagage non trouvé.' },
        { status: 404 }
      );
    }

    // ─── Exécuter le toggle ───
    let newStatus: string;

    if (body.action === 'mark-lost') {
      // Ne pas déclarer perdu si déjà perdu
      if (baggage.status === 'lost') {
        return NextResponse.json({
          success: true,
          newStatus: 'lost',
          message: 'Ce bagage est déjà déclaré perdu.',
        });
      }

      await db.baggage.update({
        where: { id: baggage.id },
        data: {
          status: 'lost',
          declaredLostAt: new Date(),
        },
      });
      newStatus = 'lost';
    } else {
      // mark-found → revenir à active
      await db.baggage.update({
        where: { id: baggage.id },
        data: {
          status: 'active',
          foundAt: new Date(),
        },
      });
      newStatus = 'active';
    }

    const latencyMs = Date.now() - startTime;
    logMetric('baggage-status', 'post', latencyMs, true, {
      key: reference,
      details: `action=${body.action}, newStatus=${newStatus}`,
    });

    return NextResponse.json({
      success: true,
      newStatus,
      message: newStatus === 'lost'
        ? 'Bagage déclaré perdu.'
        : 'Bagage marqué comme retrouvé.',
    });

  } catch (error) {
    const latencyMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Erreur serveur';

    logMetric('baggage-status', 'post', latencyMs, false, {
      key: 'error',
      details: message,
    });

    console.error('[Baggage Status API] Erreur:', message);
    return NextResponse.json(
      { success: false, message: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}