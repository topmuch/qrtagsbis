import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all QR code sets, optionally filtered by type and grouped by agency
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'hajj' or 'voyageur'
    const search = searchParams.get('search');
    const agencyId = searchParams.get('agencyId');

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (type && type !== 'all') {
      where.type = type;
    }
    
    if (agencyId) {
      where.agencyId = agencyId;
    }
    
    if (search) {
      where.OR = [
        { reference: { contains: search.toUpperCase() } },
        { setId: { contains: search.toUpperCase() } },
        { travelerFirstName: { contains: search } },
        { travelerLastName: { contains: search } },
      ];
    }

    // Get all baggages
    const baggages = await db.baggage.findMany({
      where,
      include: { agency: true },
      orderBy: { createdAt: 'desc' },
    });

    // Group by setId or create virtual sets based on reference prefix (first part before -)
    const setsMap = new Map<string, {
      id: string;
      setId: string;
      type: string;
      agencyId: string | null;
      agencyName: string | null;
      createdAt: Date;
      qrCount: number;
      references: string[];
      status: string;
      travelerName: string | null;
      baggageIds: string[];
    }>();

    baggages.forEach((baggage) => {
      // Use setId if available, otherwise group by reference prefix (e.g., HAJJ26)
      const setId = baggage.setId || baggage.reference.split('-')[0];
      
      if (!setsMap.has(setId)) {
        setsMap.set(setId, {
          id: setId,
          setId: setId,
          type: baggage.type,
          agencyId: baggage.agencyId,
          agencyName: baggage.agency?.name || null,
          createdAt: baggage.createdAt,
          qrCount: 0,
          references: [],
          status: 'generated',
          travelerName: baggage.travelerFirstName 
            ? `${baggage.travelerFirstName} ${baggage.travelerLastName || ''}`.trim()
            : null,
          baggageIds: [],
        });
      }
      
      const set = setsMap.get(setId)!;
      set.qrCount++;
      set.references.push(baggage.reference);
      set.baggageIds.push(baggage.id);
    });

    // Convert to array and sort by date
    const sets = Array.from(setsMap.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Calculate stats
    const stats = {
      totalSets: sets.length,
      totalQr: baggages.length,
      hajjSets: sets.filter(s => s.type === 'hajj').length,
      voyageurSets: sets.filter(s => s.type === 'voyageur').length,
    };

    return NextResponse.json({
      sets,
      stats,
    });

  } catch (error) {
    console.error('Get QR codes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a QR code set
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const setId = searchParams.get('setId');

    if (!setId) {
      return NextResponse.json(
        { error: 'Set ID is required' },
        { status: 400 }
      );
    }

    console.log(`[DELETE QR] Attempting to delete set: ${setId}`);

    // Build the where clause - match by setId OR by reference prefix
    const whereClause = {
      OR: [
        { setId: setId },
        { reference: { startsWith: `${setId}-` } }
      ]
    };

    // Find all baggages matching this set
    const baggages = await db.baggage.findMany({
      where: whereClause,
      select: { id: true, reference: true }
    });

    if (baggages.length === 0) {
      console.log(`[DELETE QR] No baggages found for set: ${setId}`);
      return NextResponse.json(
        { error: 'Set not found', setId },
        { status: 404 }
      );
    }

    console.log(`[DELETE QR] Found ${baggages.length} baggages:`, baggages.map(b => b.reference));

    const baggageIds = baggages.map(b => b.id);

    // Delete baggages (ScanLogs will be cascade deleted automatically)
    const deleteResult = await db.baggage.deleteMany({ 
      where: { id: { in: baggageIds } } 
    });

    console.log(`[DELETE QR] Successfully deleted ${deleteResult.count} baggages`);

    return NextResponse.json({ 
      success: true, 
      deletedCount: deleteResult.count,
      setId,
      deletedReferences: baggages.map(b => b.reference)
    });

  } catch (error) {
    console.error('Delete QR code set error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
