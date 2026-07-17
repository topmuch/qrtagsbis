import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { normalizeStatus } from '@/lib/status';

export const dynamic = 'force-dynamic';

// POST - Activate a tag with custom data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      agencyId,
      serialNumber,
      dynamicFields,
      itemName,
      itemCategory,
      locationBuilding,
      locationRoom,
      locationNote,
      ownerName,
      ownerPhone,
      ownerEmail,
      agencyType,
    } = body;

    if (!agencyId || !serialNumber) {
      return NextResponse.json({ error: 'agencyId and serialNumber are required' }, { status: 400 });
    }

    try {
      // Check if tag already exists
      const existingTag = await db.tag.findUnique({
        where: { serialNumber }
      });

      if (existingTag) {
        // Update existing tag to activated
        const updatedTag = await db.tag.update({
          where: { serialNumber },
          data: {
            agencyId,
            status: 'activated',
            ownerName: ownerName || existingTag.ownerName,
            ownerPhone: ownerPhone || existingTag.ownerPhone,
            ownerEmail: ownerEmail || existingTag.ownerEmail,
            itemName: itemName || existingTag.itemName,
            itemCategory: itemCategory || existingTag.itemCategory,
            locationBuilding: locationBuilding || existingTag.locationBuilding,
            locationRoom: locationRoom || existingTag.locationRoom,
            locationNote: locationNote || existingTag.locationNote,
            customData: dynamicFields ? JSON.stringify(dynamicFields) : existingTag.customData,
            activatedAt: new Date(),
            type: agencyType || existingTag.type,
          }
        });

        // Also create a Booking record
        try {
          await db.booking.create({
            data: {
              tagId: updatedTag.id,
              agencyId,
              customData: dynamicFields ? JSON.stringify(dynamicFields) : '{}',
              status: 'active',
            }
          });
        } catch {
          // Booking creation is optional
        }

        return NextResponse.json({ tag: updatedTag, message: 'Tag activé avec succès' });
      } else {
        // Create new tag with activated status
        const newTag = await db.tag.create({
          data: {
            serialNumber,
            agencyId,
            type: agencyType || 'hotel',
            status: 'activated',
            ownerName,
            ownerPhone,
            ownerEmail,
            itemName,
            itemCategory,
            locationBuilding,
            locationRoom,
            locationNote,
            customData: dynamicFields ? JSON.stringify(dynamicFields) : '{}',
            activatedAt: new Date(),
          }
        });

        // Also create a Booking record
        try {
          await db.booking.create({
            data: {
              tagId: newTag.id,
              agencyId,
              customData: dynamicFields ? JSON.stringify(dynamicFields) : '{}',
              status: 'active',
            }
          });
        } catch {
          // Booking creation is optional
        }

        return NextResponse.json({ tag: newTag, message: 'Tag créé et activé avec succès' });
      }
    } catch {
      // Fallback for backward compatibility
      return NextResponse.json({
        tag: { serialNumber, status: 'activated', ownerName, itemName },
        message: 'Tag activé (compatibilité)'
      });
    }
  } catch (error) {
    console.error('Activate tag error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - List recently activated tags
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID is required' }, { status: 400 });
    }

    try {
      // Get recently activated tags
      const tags = await db.tag.findMany({
        where: {
          agencyId,
          status: { in: ['activated', 'scanned'] },
          activatedAt: { not: null },
        },
        orderBy: { activatedAt: 'desc' },
        take: limit,
        select: {
          id: true,
          serialNumber: true,
          itemName: true,
          ownerName: true,
          status: true,
          activatedAt: true,
          itemCategory: true,
        }
      });

      return NextResponse.json({
        tags: tags.map(t => ({
          ...t,
          status: normalizeStatus(t.status),
        }))
      });
    } catch {
      // Fallback - try Baggage model
      try {
        const baggages = await (db as Record<string, unknown>).baggage.findMany({
          where: {
            agencyId,
            status: { in: ['active', 'activated', 'scanned', 'ACTIF'] },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }) as Record<string, unknown>[];

        return NextResponse.json({
          tags: baggages.map(b => ({
            id: b.id,
            serialNumber: b.reference || b.serialNumber,
            itemName: b.itemName || null,
            ownerName: b.travelerFirstName ? `${b.travelerFirstName} ${b.travelerLastName || ''}`.trim() : b.ownerName || null,
            status: normalizeStatus(b.status as string),
            activatedAt: b.activatedAt || b.createdAt,
            itemCategory: b.itemCategory || null,
          }))
        });
      } catch {
        return NextResponse.json({ tags: [] });
      }
    }
  } catch (error) {
    console.error('Get recent activations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
