import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ─── GET /api/loss-alerts/[reference] — Get active loss alerts for a baggage ───

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    if (!reference || reference.trim().length === 0) {
      return NextResponse.json(
        { error: 'Référence de bagage requise.' },
        { status: 400 }
      );
    }

    const alerts = await db.lossAlert.findMany({
      where: {
        reference: reference.trim().toUpperCase(),
        dismissed: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Error fetching loss alerts:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des alertes.' },
      { status: 500 }
    );
  }
}