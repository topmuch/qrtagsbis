import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── POST /api/loss-alerts/[reference]/dismiss — Dismiss a loss alert ───

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await request.json();
    const { alertId } = body as { alertId?: string };

    if (!alertId || typeof alertId !== 'string' || alertId.trim().length === 0) {
      return NextResponse.json(
        { error: 'alertId est requis.' },
        { status: 400 }
      );
    }

    // Verify the alert belongs to this reference and is not already dismissed
    const alert = await db.lossAlert.findFirst({
      where: {
        id: alertId.trim(),
        reference: reference.trim().toUpperCase(),
        dismissed: false,
      },
    });

    if (!alert) {
      return NextResponse.json(
        { error: 'Alerte introuvable ou déjà ignorée.' },
        { status: 404 }
      );
    }

    await db.lossAlert.update({
      where: { id: alert.id },
      data: {
        dismissed: true,
        dismissedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, id: alert.id });
  } catch (error) {
    console.error('Error dismissing loss alert:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'ignorance de l\'alerte.' },
      { status: 500 }
    );
  }
}