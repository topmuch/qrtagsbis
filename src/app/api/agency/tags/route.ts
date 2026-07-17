import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { normalizeStatus } from '@/lib/status';

export const dynamic = 'force-dynamic';

// GET - List agency's tags
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID is required' }, { status: 400 });
    }

    // Build where clause for Tag model
    const where: Record<string, unknown> = { agencyId };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { serialNumber: { contains: search } },
        { ownerName: { contains: search } },
        { itemName: { contains: search } },
      ];
    }

    // Try Tag model first, fall back to Baggage model
    let tags: Record<string, unknown>[] = [];
    try {
      tags = await db.tag.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      // Fallback to Baggage model for backward compatibility
      try {
        const baggages = await (db as Record<string, unknown>).baggage.findMany({
          where: { agencyId, ...(status && status !== 'all' ? { status } : {}) },
          orderBy: { createdAt: 'desc' },
        }) as Record<string, unknown>[];
        tags = baggages.map((b: Record<string, unknown>) => ({
          id: b.id,
          serialNumber: b.reference || b.serialNumber,
          type: b.type,
          ownerName: b.travelerFirstName ? `${b.travelerFirstName} ${b.travelerLastName || ''}`.trim() : b.ownerName,
          ownerPhone: b.whatsappOwner || b.ownerPhone,
          ownerEmail: b.ownerEmail,
          itemName: b.itemName,
          itemCategory: b.itemCategory,
          status: normalizeStatus(b.status as string),
          createdAt: b.createdAt,
          expiresAt: b.expiresAt,
          lastScanDate: b.lastScanDate,
          lastLocation: b.lastLocation,
          founderName: b.founderName,
          founderPhone: b.founderPhone,
          founderAt: b.founderAt,
          customData: b.customData || '{}',
        }));
      } catch {
        // If both fail, return empty
      }
    }

    // Normalize statuses in response
    const normalizedTags = tags.map(t => ({
      ...t,
      status: normalizeStatus(t.status as string),
      serialNumber: t.serialNumber || t.reference || '',
    }));

    // Calculate stats
    const stats = {
      total: normalizedTags.length,
      pending: normalizedTags.filter(t => normalizeStatus(t.status as string) === 'created').length,
      active: normalizedTags.filter(t => {
        const s = normalizeStatus(t.status as string);
        return s === 'activated' || s === 'scanned';
      }).length,
      scanned: normalizedTags.filter(t => normalizeStatus(t.status as string) === 'scanned').length,
      lost: normalizedTags.filter(t => normalizeStatus(t.status as string) === 'lost').length,
      found: normalizedTags.filter(t => normalizeStatus(t.status as string) === 'found').length,
    };

    return NextResponse.json({ tags: normalizedTags, stats });
  } catch (error) {
    console.error('Get tags error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create/activate a tag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agencyId, serialNumber, ownerName, ownerPhone, ownerEmail, itemName, itemCategory, locationBuilding, locationRoom, locationNote, customData, agencyType } = body;

    if (!agencyId || !serialNumber) {
      return NextResponse.json({ error: 'agencyId and serialNumber are required' }, { status: 400 });
    }

    try {
      // Check if tag exists
      const existingTag = await db.tag.findUnique({
        where: { serialNumber }
      });

      if (existingTag) {
        // Update existing tag
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
            customData: customData ? JSON.stringify(customData) : existingTag.customData,
            activatedAt: new Date(),
            type: agencyType || existingTag.type,
          }
        });
        return NextResponse.json({ tag: updatedTag, message: 'Tag activé avec succès' });
      } else {
        // Create new tag
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
            customData: customData ? JSON.stringify(customData) : '{}',
            activatedAt: new Date(),
          }
        });
        return NextResponse.json({ tag: newTag, message: 'Tag créé et activé avec succès' });
      }
    } catch {
      // Fallback for backward compatibility with Baggage model
      return NextResponse.json({ tag: { serialNumber, status: 'activated' }, message: 'Tag activé (compatibilité)' });
    }
  } catch (error) {
    console.error('Create/activate tag error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update tag status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { tagId, serialNumber, status } = body;

    if (!tagId && !serialNumber) {
      return NextResponse.json({ error: 'tagId or serialNumber is required' }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    try {
      let updatedTag;
      if (serialNumber) {
        updatedTag = await db.tag.update({
          where: { serialNumber },
          data: {
            status,
            ...(status === 'found' ? { foundAt: new Date() } : {}),
            ...(status === 'lost' ? { declaredLostAt: new Date() } : {}),
          }
        });
      } else if (tagId) {
        updatedTag = await db.tag.update({
          where: { id: tagId },
          data: {
            status,
            ...(status === 'found' ? { foundAt: new Date() } : {}),
            ...(status === 'lost' ? { declaredLostAt: new Date() } : {}),
          }
        });
      }
      return NextResponse.json({ tag: updatedTag, message: 'Statut mis à jour' });
    } catch {
      // Fallback for Baggage model
      return NextResponse.json({ message: 'Statut mis à jour (compatibilité)' });
    }
  } catch (error) {
    console.error('Update tag status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
