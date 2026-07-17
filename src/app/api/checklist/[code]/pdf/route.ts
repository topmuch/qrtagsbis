import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateChecklistPdf, buildPublicChecklistUrl, type ChecklistItem } from '@/lib/checklist';
import { rateLimit } from '@/lib/rate-limit';

/**
 * GET /api/checklist/[code]/pdf?key=XXX
 *
 * Streams the PDF attestation. Requires the verification key.
 * PDF is generated on-demand (no on-disk persistence) for portability.
 *
 * Headers:
 *   Content-Type: application/pdf
 *   Content-Disposition: inline; filename="QRTags-attestation-{code}.pdf"
 *   Cache-Control: no-store
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const url = new URL(request.url);
    const providedKey = url.searchParams.get('key')?.trim();

    if (!providedKey) {
      return NextResponse.json({ error: 'Clé de vérification requise' }, { status: 401 });
    }

    // ─── Rate limit PDF downloads: 20 / hour / IP ───
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip')?.trim() ||
      'unknown';
    if (rateLimit(`checklist-pdf:${code}:${clientIp}`, { windowMs: 60 * 60 * 1000, maxRequests: 20 })) {
      return NextResponse.json(
        { error: 'Trop de téléchargements. Réessayez plus tard.' },
        { status: 429 }
      );
    }

    const checklist = await db.checklist.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!checklist) {
      return NextResponse.json({ error: 'Attestation introuvable' }, { status: 404 });
    }

    if (providedKey !== checklist.verificationKey) {
      return NextResponse.json({ error: 'Clé de vérification incorrecte' }, { status: 403 });
    }

    // ─── Parse items ───
    let parsedItems: ChecklistItem[] = [];
    try {
      const parsed = JSON.parse(checklist.items);
      if (Array.isArray(parsed)) {
        parsedItems = parsed.filter(
          (it): it is ChecklistItem =>
            typeof it === 'object' && it !== null &&
            typeof it.category === 'string' && typeof it.name === 'string'
        );
      }
    } catch {
      // ignore
    }

    // ─── Build public URL for QR code in PDF ───
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'qrtagss.com';
    const publicUrl = buildPublicChecklistUrl(checklist.code, `${protocol}://${host}`);

    // ─── Generate PDF ───
    const pdfBuffer = await generateChecklistPdf({
      code: checklist.code,
      verificationKey: checklist.verificationKey,
      firstName: checklist.firstName,
      lastName: checklist.lastName,
      email: checklist.email,
      departureDate: checklist.departureDate,
      destinationCountry: checklist.destinationCountry,
      airline: checklist.airline,
      items: parsedItems,
      publicUrl,
      createdAt: checklist.createdAt,
    });

    // ─── Stream as response ───
    const filename = `QRTags-attestation-${checklist.code}.pdf`;
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    const fullStack = error instanceof Error ? error.stack : '';
    console.error('[checklist/[code]/pdf] GET error:', fullStack || error);
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';

    const html = `<!DOCTYPE html>
  <html><head><meta charset="utf-8"><title>Erreur PDF</title>
  <style>body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f8fafc;color:#1e293b}
  .box{text-align:center;padding:2rem;max-width:400px}
  .icon{font-size:3rem;margin-bottom:1rem}
  h2{margin:0 0 0.5rem;font-size:1.2rem;color:#dc2626}
  p{margin:0 0 1rem;font-size:0.9rem;color:#64748b}
  a{color:#2563eb;text-decoration:underline}</style></head>
  <body><div class="box">
  <div class="icon">⚠️</div>
  <h2>Erreur de génération du PDF</h2>
  <p>La génération du document a échoué. Veuillez réessayer.</p>
  <p style="font-size:0.75rem;color:#94a3b8">${msg.replace(/</g, '&lt;')}</p>
  </div></body></html>`;

    return new NextResponse(html, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
