import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Export baggages to CSV
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const status = searchParams.get('status'); // optional filter
    const type = searchParams.get('type'); // optional filter

    // Build filter
    const filter: Record<string, unknown> = {};
    if (agencyId) filter.agencyId = agencyId;
    if (status) filter.status = status;
    if (type) filter.type = type;

    // Fetch baggages with related data
    const baggages = await db.baggage.findMany({
      where: filter,
      include: {
        agency: true,
        scanLogs: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // CSV Headers
    const headers = [
      'Référence',
      'Type',
      'Statut',
      'Pèlerin/Voyageur',
      'WhatsApp',
      'Type Bagage',
      'Numéro',
      'Vol',
      'Destination',
      'Agence',
      'Date Création',
      'Dernier Scan',
      'Lieu',
      'Déclaré Perdu',
      'Retrouvé',
    ];

    // CSV Rows
    const rows = baggages.map(b => [
      b.reference,
      b.type === 'hajj' ? 'Hajj' : 'Voyageur',
      getStatusLabel(b.status),
      `${b.travelerFirstName || ''} ${b.travelerLastName || ''}`.trim() || '-',
      b.whatsappOwner || '-',
      b.baggageType === 'cabine' ? 'Cabine' : 'Soute',
      b.baggageIndex.toString(),
      b.flightNumber || '-',
      b.destination || '-',
      b.agency?.name || '-',
      b.createdAt.toLocaleDateString('fr-FR'),
      b.lastScanDate ? b.lastScanDate.toLocaleDateString('fr-FR') : '-',
      b.lastLocation || '-',
      b.declaredLostAt ? b.declaredLostAt.toLocaleDateString('fr-FR') : '-',
      b.foundAt ? b.foundAt.toLocaleDateString('fr-FR') : '-',
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';')),
    ].join('\n');

    // Create response with CSV file
    const filename = `qrtags-export-${new Date().toISOString().split('T')[0]}.csv`;
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_activation: 'En attente',
    active: 'Actif',
    scanned: 'Scanné',
    lost: 'Perdu',
    found: 'Retrouvé',
    blocked: 'Bloqué',
  };
  return labels[status] || status;
}
