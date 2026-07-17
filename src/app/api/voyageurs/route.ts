import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all tag owners with their tags
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const agencyId = searchParams.get('agencyId');
    const search = searchParams.get('search');

    // Build where clause for tags
    const where: Record<string, unknown> = {
      ownerName: { not: null }, // Only activated tags
    };

    if (agencyId && agencyId !== 'all') {
      where.agencyId = agencyId;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { ownerName: { contains: search } },
        { serialNumber: { contains: search.toUpperCase() } },
      ];
    }

    // Get all activated tags
    const tags = await db.tag.findMany({
      where,
      include: { agency: true },
      orderBy: { createdAt: 'desc' },
    });

    // Group by owner (name + phone)
    const ownersMap = new Map<string, {
      id: string;
      firstName: string;
      lastName: string;
      whatsapp: string;
      agencyName: string | null;
      tags: typeof tags;
      lastScan: Date | null;
    }>();

    tags.forEach((tag) => {
      const nameParts = (tag.ownerName || '').split(' ');
      const key = `${tag.ownerName}_${tag.ownerPhone}`;

      if (!ownersMap.has(key)) {
        ownersMap.set(key, {
          id: key,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          whatsapp: tag.ownerPhone || '',
          agencyName: tag.agency?.name || null,
          tags: [],
          lastScan: null,
        });
      }

      const owner = ownersMap.get(key)!;
      owner.tags.push(tag);

      // Update last scan
      if (tag.lastScanDate) {
        if (!owner.lastScan || new Date(tag.lastScanDate) > owner.lastScan) {
          owner.lastScan = new Date(tag.lastScanDate);
        }
      }
    });

    // Convert to array
    const travelers = Array.from(ownersMap.values()).map((owner) => ({
      ...owner,
      tags: owner.tags.map((t) => ({
        id: t.id,
        reference: t.serialNumber,
        type: t.tagType,
        status: t.status,
        itemName: t.itemName,
        lastScanDate: t.lastScanDate,
        lastLocation: t.lastLocation,
      })),
      lastScan: owner.lastScan?.toISOString() || null,
    }));

    return NextResponse.json({
      travelers,
      total: travelers.length,
    });

  } catch (error) {
    console.error('Get travelers error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
