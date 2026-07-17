import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuthApi } from '@/lib/auth-middleware';

// GET - List tags with filters
export async function GET(request: NextRequest) {
  try {
    await requireAuthApi();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const agencyId = searchParams.get('agencyId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');

    const where: Record<string, unknown> = {};

    if (type) where.tagType = type;
    if (status) where.status = status;
    if (agencyId) where.agencyId = agencyId;
    if (search) {
      where.OR = [
        { serialNumber: { contains: search } },
        { ownerName: { contains: search } },
        { itemName: { contains: search } },
      ];
    }

    const tags = await db.tag.findMany({
      where,
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            agencyType: { select: { name: true, label: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    });

    const total = await db.tag.count({ where });

    return NextResponse.json({ tags, total });
  } catch (error) {
    console.error('Error fetching tags:', error);
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Update tag (status change)
export async function PATCH(request: NextRequest) {
  try {
    await requireAuthApi();

    const body = await request.json();
    const { id, status, ownerName, ownerPhone, ownerEmail, itemName, itemDescription } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID du tag requis' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) {
      updateData.status = status;
      if (status === 'found') updateData.foundAt = new Date();
      if (status === 'lost') updateData.declaredLostAt = new Date();
    }
    if (ownerName !== undefined) updateData.ownerName = ownerName;
    if (ownerPhone !== undefined) updateData.ownerPhone = ownerPhone;
    if (ownerEmail !== undefined) updateData.ownerEmail = ownerEmail;
    if (itemName !== undefined) updateData.itemName = itemName;
    if (itemDescription !== undefined) updateData.itemDescription = itemDescription;

    const tag = await db.tag.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ tag });
  } catch (error) {
    console.error('Error updating tag:', error);
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Delete a tag
export async function DELETE(request: NextRequest) {
  try {
    await requireAuthApi();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID du tag requis' }, { status: 400 });
    }

    await db.tag.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
