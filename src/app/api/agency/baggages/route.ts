import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { normalizeStatus, isPending, isActive, statusFilterIn } from '@/lib/status';

export const dynamic = 'force-dynamic';

// GET - List all baggages for an agency
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      );
    }

    // Build where clause — NO status filter by default (show ALL baggages)
    const where: Record<string, unknown> = { agencyId };

    // If a specific status filter is requested, match BOTH French and English variants
    if (status && status !== 'all') {
      where.status = statusFilterIn(status as 'pending_activation' | 'active' | 'scanned' | 'lost' | 'found' | 'blocked');
    }

    if (search) {
      where.OR = [
        { reference: { contains: search } },
        { travelerFirstName: { contains: search } },
        { travelerLastName: { contains: search } },
      ];
    }

    const baggages = await db.baggage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Normalize statuses in response (frontend always gets English format)
    const normalizedBaggages = baggages.map(b => ({
      ...b,
      status: normalizeStatus(b.status),
    }));

    // Calculate stats using normalized statuses
    const stats = {
      total: normalizedBaggages.length,
      pending: normalizedBaggages.filter(b => isPending(b.status)).length,
      active: normalizedBaggages.filter(b => isActive(b.status)).length,
      scanned: normalizedBaggages.filter(b => b.status === 'scanned').length,
      lost: normalizedBaggages.filter(b => b.status === 'lost').length,
      found: normalizedBaggages.filter(b => b.status === 'found').length,
    };

    return NextResponse.json(
      { baggages: normalizedBaggages, stats },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );

  } catch (error) {
    console.error('Get baggages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Bulk delete baggages for an agency
// Body: { agencyId: string, ids: string[] } or { agencyId: string, status: 'pending_activation' }
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { agencyId, ids, status } = body;

    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID requis' },
        { status: 400 }
      );
    }

    let where: Record<string, unknown> = { agencyId };

    if (ids && Array.isArray(ids) && ids.length > 0) {
      // Delete specific baggage IDs
      where.id = { in: ids };
    } else if (status === 'pending_activation') {
      // Delete all pending activation baggages for this agency
      where.status = { in: ['pending_activation', 'en_attente'] };
    } else {
      return NextResponse.json(
        { error: 'Spécifiez les IDs à supprimer ou le statut "pending_activation"' },
        { status: 400 }
      );
    }

    // Safety: prevent deleting active/lost/found baggages unless explicitly by ID
    if (!ids) {
      // Only allow bulk delete by status for pending
      const count = await db.baggage.count({ where });
      if (count === 0) {
        return NextResponse.json(
          { error: 'Aucun baggage à supprimer avec ces critères' },
          { status: 404 }
        );
      }
    }

    const result = await db.baggage.deleteMany({ where });

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `${result.count} baggage(s) supprimé(s)`
    });
  } catch (error) {
    console.error('Bulk delete baggages error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
