import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch Hajj pilgrims with their baggages
export async function GET() {
  try {
    // Get all Hajj baggages
    const baggages = await db.baggage.findMany({
      where: {
        type: 'hajj'
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

    // Group baggages by traveler (firstName + lastName combination)
    const pilgrimsMap = new Map<string, {
      id: string;
      firstName: string;
      lastName: string;
      whatsapp: string | null;
      agencyId: string | null;
      agency: { id: string; name: string } | null;
      createdAt: Date;
      baggages: typeof baggages;
    }>();

    baggages.forEach(baggage => {
      const key = `${baggage.travelerFirstName || 'Unknown'}_${baggage.travelerLastName || 'Unknown'}_${baggage.agencyId || 'no-agency'}`;

      if (!pilgrimsMap.has(key)) {
        pilgrimsMap.set(key, {
          id: key, // Use the composite key as ID
          firstName: baggage.travelerFirstName || 'Unknown',
          lastName: baggage.travelerLastName || 'Unknown',
          whatsapp: baggage.whatsappOwner,
          agencyId: baggage.agencyId,
          agency: baggage.agency ? {
            id: baggage.agency.id,
            name: baggage.agency.name
          } : null,
          createdAt: baggage.createdAt,
          baggages: []
        });
      }

      pilgrimsMap.get(key)!.baggages.push(baggage);
    });

    // Convert to array and sort by creation date
    const pilgrims = Array.from(pilgrimsMap.values()).sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );

    // Get unique agencies for filter
    const agencies = await db.agency.findMany({
      where: {
        baggages: {
          some: {
            type: 'hajj'
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
      pilgrims,
      agencies
    });
  } catch (error) {
    console.error('Error fetching Hajj pilgrims:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des pèlerins' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a pilgrim and all their baggages
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pilgrimKey = searchParams.get('id');

    if (!pilgrimKey) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    // Parse the key to get traveler info
    const [firstName, lastName, agencyPart] = pilgrimKey.split('_');
    const agencyId = agencyPart === 'no-agency' ? null : agencyPart;

    // Delete all baggages for this pilgrim
    await db.baggage.deleteMany({
      where: {
        type: 'hajj',
        travelerFirstName: firstName,
        travelerLastName: lastName,
        agencyId: agencyId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pilgrim:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
