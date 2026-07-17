import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Fetch agency profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');

    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      );
    }

    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        address: true,
        active: true,
        createdAt: true,
      },
    });

    if (!agency) {
      return NextResponse.json(
        { error: 'Agency not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { agency },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );

  } catch (error) {
    console.error('Error fetching agency profile:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du profil' },
      { status: 500 }
    );
  }
}

// PUT - Update agency profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { agencyId, name, email, phone, address } = body;

    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      );
    }

    const agency = await db.agency.update({
      where: { id: agencyId },
      data: {
        name,
        email,
        phone,
        address,
      },
    });

    return NextResponse.json({ success: true, agency });

  } catch (error) {
    console.error('Error updating agency profile:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
}
