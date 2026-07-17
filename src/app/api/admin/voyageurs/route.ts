import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch Voyageurs (type: voyageur)
export async function GET() {
  try {
    // Get all Voyageur baggages
    const baggages = await db.baggage.findMany({
      where: {
        type: 'voyageur'
      },
      include: {
        agency: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group baggages by traveler (firstName + lastName + whatsapp combination)
    const travelersMap = new Map<string, {
      id: string;
      firstName: string | null;
      lastName: string | null;
      whatsapp: string | null;
      agencyId: string | null;
      agency: { id: string; name: string } | null;
      baggageCount: number;
      baggages: typeof baggages;
      createdAt: Date;
      baggageIds: string[];
    }>();

    baggages.forEach(baggage => {
      // Create a unique key using JSON stringify to handle special characters
      const keyData = {
        firstName: baggage.travelerFirstName || '',
        lastName: baggage.travelerLastName || '',
        whatsapp: baggage.whatsappOwner || '',
        agencyId: baggage.agencyId || ''
      };
      const key = JSON.stringify(keyData);

      if (!travelersMap.has(key)) {
        travelersMap.set(key, {
          id: key,
          firstName: baggage.travelerFirstName,
          lastName: baggage.travelerLastName,
          whatsapp: baggage.whatsappOwner,
          agencyId: baggage.agencyId,
          agency: baggage.agency ? {
            id: baggage.agency.id,
            name: baggage.agency.name
          } : null,
          baggageCount: 0,
          baggages: [],
          createdAt: baggage.createdAt,
          baggageIds: []
        });
      }

      const traveler = travelersMap.get(key)!;
      traveler.baggages.push(baggage);
      traveler.baggageCount = traveler.baggages.length;
      traveler.baggageIds.push(baggage.id);
    });

    // Convert to array and sort
    const travelers = Array.from(travelersMap.values()).sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );

    // Get unique agencies for filter
    const agencies = await db.agency.findMany({
      where: {
        baggages: {
          some: {
            type: 'voyageur'
          }
        }
      },
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      travelers,
      agencies
    });
  } catch (error) {
    console.error('Error fetching voyageurs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des voyageurs' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a traveler and all their baggages
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const travelerKey = searchParams.get('id');

    if (!travelerKey) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    console.log('[DELETE VOYAGEUR] Key received:', travelerKey);

    // Parse the key
    let keyData: { firstName: string; lastName: string; whatsapp: string; agencyId: string };
    try {
      keyData = JSON.parse(travelerKey);
    } catch {
      console.error('[DELETE VOYAGEUR] Failed to parse key');
      return NextResponse.json({ error: 'Clé invalide' }, { status: 400 });
    }

    const { firstName, lastName, whatsapp, agencyId } = keyData;
    
    console.log('[DELETE VOYAGEUR] Parsed:', { firstName, lastName, whatsapp, agencyId });

    // Build where clause
    const whereClause: Record<string, unknown> = {
      type: 'voyageur',
      travelerFirstName: firstName || null,
      travelerLastName: lastName || null,
      whatsappOwner: whatsapp || null,
      agencyId: agencyId || null
    };

    // Find baggages
    const baggages = await db.baggage.findMany({
      where: whereClause,
      select: { id: true, reference: true }
    });

    console.log(`[DELETE VOYAGEUR] Found ${baggages.length} baggages:`, baggages.map(b => b.reference));

    if (baggages.length === 0) {
      return NextResponse.json({ 
        error: 'Voyageur non trouvé',
        key: keyData
      }, { status: 404 });
    }

    const baggageIds = baggages.map(b => b.id);

    // Delete baggages (ScanLogs cascade automatically)
    const deleteResult = await db.baggage.deleteMany({
      where: { id: { in: baggageIds } }
    });

    console.log(`[DELETE VOYAGEUR] Deleted ${deleteResult.count} baggages`);

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
      deletedReferences: baggages.map(b => b.reference)
    });
  } catch (error) {
    console.error('Error deleting traveler:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression', details: String(error) },
      { status: 500 }
    );
  }
}
