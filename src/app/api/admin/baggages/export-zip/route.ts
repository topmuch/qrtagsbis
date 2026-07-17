import { NextRequest, NextResponse } from 'next/server';
import { ZipArchive } from 'archiver';
import { Readable } from 'stream';
import { db } from '@/lib/db';
import {
  generateQRCodeImage,
  formatSetFolderName as formatPassengerFolderName,
} from '@/lib/qr-server';

/**
 * POST /api/admin/baggages/export-zip
 *
 * Export QR codes as a ZIP file organized by passenger.
 * Uses STREAMING response to handle large exports (1800+ QR codes)
 * without memory issues or timeouts.
 *
 * Body:
 *   - agencyId: string (required) - Filter by agency
 *   - type: 'hajj' | 'voyageur' (optional) - Filter by type
 *   - setId: string (optional) - Export a specific set only
 *   - setIds: string[] (optional) - Export multiple specific sets
 *   - status: string (optional) - Filter by status
 *
 * Response: Streaming ZIP file
 */

// Max QR codes per export to prevent server overload
const MAX_EXPORT_SIZE = 5000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agencyId, type, setId, setIds, status } = body;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (agencyId && agencyId !== '__all__') {
      where.agencyId = agencyId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    // Filter by specific set(s)
    if (setId) {
      where.setId = setId;
    } else if (setIds && Array.isArray(setIds) && setIds.length > 0) {
      where.setId = { in: setIds };
    }

    // If no filter at all, reject to prevent accidental massive exports
    if (!agencyId && !setId && (!setIds || setIds.length === 0)) {
      return NextResponse.json(
        { error: 'Veuillez spécifier au moins un filtre (agencyId, setId, ou setIds)' },
        { status: 400 }
      );
    }

    // First, count total baggages to check size
    const totalCount = await db.tag.count({ where });

    if (totalCount === 0) {
      return NextResponse.json(
        { error: 'Aucun baggage trouvé avec ces critères' },
        { status: 404 }
      );
    }

    if (totalCount > MAX_EXPORT_SIZE) {
      return NextResponse.json(
        { error: `Trop de objets (${totalCount}). Maximum ${MAX_EXPORT_SIZE} par export. Veuillez filtrer par type ou par set.` },
        { status: 400 }
      );
    }

    // Fetch baggages
    const baggages = await db.tag.findMany({
      where,
      include: { agency: true },
      orderBy: [{ setId: 'asc' }, { baggageIndex: 'asc' }],
    });

    // Get base URL from request
    const protocol = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol.replace(':', '');
    const host = request.headers.get('host') || request.nextUrl.host;
    const baseUrl = `${protocol}://${host}`;

    // Build maps for folder naming
    const travelerInfoMap = new Map<string, { firstName: string | null; lastName: string | null }>();
    const setIdOrder: string[] = [];

    for (const baggage of baggages) {
      const key = baggage.setId || baggage.serialNumber.split('-')[0];
      if (!travelerInfoMap.has(key)) {
        travelerInfoMap.set(key, {
          firstName: baggage.ownerName?.split(' ')[0] || null,
          lastName: baggage.ownerName?.split(' ').slice(1).join(' ') || null,
        });
        setIdOrder.push(key);
      }
    }

    const sortedSetIds = setIdOrder.sort();

    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const agencyName = baggages[0]?.agency?.name || 'export';
    const baggageType = type || 'all';
    const zipFilename = `QRTags-${agencyName}-${baggageType}-${baggages.length}QR-${timestamp}.zip`;

    // Group baggages by setId
    const baggagesBySetId = new Map<string, typeof baggages>();
    for (const baggage of baggages) {
      const key = baggage.setId || baggage.serialNumber.split('-')[0];
      if (!baggagesBySetId.has(key)) {
        baggagesBySetId.set(key, []);
      }
      baggagesBySetId.get(key)!.push(baggage);
    }

    // Create ZIP archive - it's a readable stream
    const archive = new ZipArchive({
      zlib: { level: 6 },
    });

    // Convert Node.js Readable to Web ReadableStream for streaming response
    const nodeStream = archive as unknown as Readable;
    const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

    // Process QR codes ASYNCHRONOUSLY and add to archive progressively
    // This allows the ZIP to stream to the client while we're still generating QR codes
    const processingPromise = (async () => {
      try {
        const CHUNK_SIZE = 10; // Smaller chunks for better memory control with large sets

        for (let chunkStart = 0; chunkStart < sortedSetIds.length; chunkStart += CHUNK_SIZE) {
          const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, sortedSetIds.length);
          const chunkSetIds = sortedSetIds.slice(chunkStart, chunkEnd);

          // Generate QR images for this chunk - SEQUENTIALLY within chunk to limit memory
          for (let i = 0; i < chunkSetIds.length; i++) {
            const currentSetId = chunkSetIds[i];
            const globalIndex = chunkStart + i;
            const setBaggages = baggagesBySetId.get(currentSetId) || [];
            const travelerInfo = travelerInfoMap.get(currentSetId);

            const folderName = formatPassengerFolderName(
              globalIndex,
              currentSetId,
              travelerInfo?.firstName,
              travelerInfo?.lastName,
            );

            // Generate QR images for each baggage in this set
            for (const baggage of setBaggages) {
              try {
                const image = await generateQRCodeImage({
                  reference: baggage.serialNumber,
                  type: baggage.type as 'hajj' | 'voyageur',
                  baggageIndex: baggage.itemCategory,
                  baggageType: baggage.baggageType,
                  baseUrl,
                });
                archive.append(image.buffer, { name: `${folderName}/${image.filename}` });
              } catch (qrError) {
                console.error(`[EXPORT-ZIP] Error generating QR for ${baggage.serialNumber}:`, qrError);
              }
            }

            // Add README for this passenger
            const readmeContent = generatePassengerReadme(
              currentSetId,
              setBaggages.map(b => ({
                reference: b.reference,
                baggageIndex: b.baggageIndex,
                baggageType: b.baggageType,
              })),
              travelerInfo?.firstName,
              travelerInfo?.lastName,
            );
            archive.append(Buffer.from(readmeContent, 'utf-8'), { name: `${folderName}/README.txt` });
          }

          // Log progress for large exports
          if (chunkEnd % 100 === 0 || chunkEnd === sortedSetIds.length) {
            console.log(`[EXPORT-ZIP] Progress: ${chunkEnd}/${sortedSetIds.length} passengers processed`);
          }
        }

        // Add a global manifest file
        const manifestContent = generateManifest(baggages, sortedSetIds, travelerInfoMap);
        archive.append(manifestContent, { name: '_MANIFEST.txt' });

        // Finalize - this ends the stream
        await archive.finalize();
        console.log(`[EXPORT-ZIP] Export complete: ${baggages.length} QR codes, ${sortedSetIds.length} passengers`);
      } catch (processingError) {
        console.error('[EXPORT-ZIP] Processing error:', processingError);
        // Try to abort the archive on error
        archive.abort();
      }
    })();

    // Return the streaming response immediately - the ZIP data will flow
    // to the client as we generate it, avoiding memory buildup and timeouts
    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(zipFilename)}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Export-Count': String(baggages.length),
        'X-Export-Passengers': String(sortedSetIds.length),
      },
    });
  } catch (error) {
    console.error('[EXPORT-ZIP] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'export ZIP', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Generate a README.txt for each passenger folder
 */
function generatePassengerReadme(
  setId: string,
  images: Array<{ reference: string; baggageIndex: number; baggageType: string }>,
  firstName?: string | null,
  lastName?: string | null,
): string {
  const lines: string[] = [
    '===================================',
    '  QRTags - QR Codes Objet',
    '===================================',
    '',
    `Set ID    : ${setId}`,
    `Passager  : ${firstName || 'En attente d\'activation'} ${lastName || ''}`.trim(),
    `Date      : ${new Date().toLocaleDateString('fr-FR')}`,
    '',
    '--- QR Codes ---',
    '',
  ];

  for (const img of images) {
    const typeLabel = img.baggageType === 'cabine' ? 'Objet cabine' : 'Objet soute';
    lines.push(`  ${typeLabel} #${img.baggageIndex}: ${img.reference}`);
  }

  lines.push('');
  lines.push('--- Instructions ---');
  lines.push('');
  lines.push('1. Imprimez chaque QR code sur une etiquette.');
  lines.push('2. Collez chaque etiquette sur le objet correspondant.');
  lines.push('3. Le voyageur active ses QR codes sur qrtagss.com/activate');
  lines.push('4. Si un objet est perdu, le trouveur scanne le QR code');
  lines.push('   et le proprietaire recoit une notification WhatsApp.');
  lines.push('');
  lines.push('QRTags - Protegez vos objets, en toute serenite.');

  return lines.join('\n');
}

/**
 * Generate a global manifest for the ZIP
 */
function generateManifest(
  baggages: Array<{
    reference: string;
    type: string;
    setId: string | null;
    baggageIndex: number;
    baggageType: string;
    travelerFirstName: string | null;
    travelerLastName: string | null;
    status: string;
    createdAt: Date;
  }>,
  sortedSetIds: string[],
  travelerInfoMap: Map<string, { firstName: string | null; lastName: string | null }>,
): string {
  const lines: string[] = [
    '===================================',
    '  QRTags - Export Manifest',
    '===================================',
    '',
    `Date d'export    : ${new Date().toLocaleString('fr-FR')}`,
    `Total QR codes   : ${baggages.length}`,
    `Total passagers  : ${sortedSetIds.length}`,
    `Type             : ${baggages[0]?.type === 'hajj' ? 'Hajj' : 'Voyageur'}`,
    '',
    '--- Liste des passagers ---',
    '',
  ];

  sortedSetIds.forEach((currentSetId, index) => {
    const info = travelerInfoMap.get(currentSetId);
    const paddedIndex = String(index + 1).padStart(3, '0');
    const name = info?.firstName && info?.lastName
      ? `${info.firstName} ${info.lastName}`
      : 'En attente d\'activation';
    lines.push(`  ${paddedIndex}. ${currentSetId} - ${name}`);
  });

  lines.push('');
  lines.push('--- Details complets ---');
  lines.push('');

  for (const baggage of baggages) {
    lines.push(
      `${baggage.serialNumber} | Set: ${baggage.setId || 'N/A'} | ` +
      `Type: ${baggage.baggageType} #${baggage.itemCategory} | ` +
      `Statut: ${baggage.status} | ` +
      `Passager: ${baggage.ownerName || '-'}`,
    );
  }

  return lines.join('\n');
}
