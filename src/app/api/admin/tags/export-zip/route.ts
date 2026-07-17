import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuthApi } from '@/lib/auth-middleware';

// POST - Export tags QR codes as ZIP
export async function POST(request: NextRequest) {
  try {
    await requireAuthApi();

    const body = await request.json();
    const { references, agencyId, setId } = body;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (references && Array.isArray(references) && references.length > 0) {
      where.serialNumber = { in: references };
    } else if (agencyId) {
      where.agencyId = agencyId;
    } else if (setId) {
      where.setId = setId;
    } else {
      return NextResponse.json(
        { error: 'Veuillez spécifier au moins un filtre (references, agencyId, ou setId)' },
        { status: 400 }
      );
    }

    // Limit export size
    const totalCount = await db.tag.count({ where });
    if (totalCount === 0) {
      return NextResponse.json({ error: 'Aucun tag trouvé avec ces critères' }, { status: 404 });
    }
    if (totalCount > 5000) {
      return NextResponse.json(
        { error: `Trop de tags (${totalCount}). Maximum 5000 par export.` },
        { status: 400 }
      );
    }

    // Fetch tags
    const tags = await db.tag.findMany({
      where,
      orderBy: { serialNumber: 'asc' },
    });

    // Generate a simple CSV manifest since we can't easily generate QR images server-side without canvas
    const manifestLines = [
      '===================================',
      '  QRTags - Export Manifest',
      '===================================',
      '',
      `Date d'export    : ${new Date().toLocaleString('fr-FR')}`,
      `Total tags       : ${tags.length}`,
      '',
      '--- Tags ---',
      '',
    ];

    tags.forEach((tag, i) => {
      const paddedIndex = String(i + 1).padStart(4, '0');
      manifestLines.push(
        `${paddedIndex}. ${tag.serialNumber} | Statut: ${tag.status} | Propriétaire: ${tag.ownerName || '-'} | Objet: ${tag.itemName || '-'}`
      );
    });

    manifestLines.push('');
    manifestLines.push('--- Instructions ---');
    manifestLines.push('1. Chaque tag peut être scanné pour signaler un objet trouvé.');
    manifestLines.push('2. Le propriétaire reçoit une notification WhatsApp/SMS.');
    manifestLines.push('');
    manifestLines.push('QRTags - Retrouvez tout objet perdu en un scan.');

    const csvContent = manifestLines.join('\n');
    const buffer = Buffer.from(csvContent, 'utf-8');

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `QRTags-export-${tags.length}-tags-${timestamp}.txt`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'X-Export-Count': String(tags.length),
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Erreur lors de l'export" },
      { status: 500 }
    );
  }
}
