import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  generateChecklistCode,
  generateVerificationKey,
  generateChecklistPdf,
  buildPublicChecklistUrl,
  type ChecklistItem,
} from '@/lib/checklist';
import { sendEmail, getChecklistEmailTemplate } from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';

/**
 * GET /api/checklist?email=foo@bar.com
 *
 * Returns all public checklists generated for a given email address.
 * Used by the public history view (multiple timestamped PDFs).
 *
 * Returns only public metadata (code, createdAt, firstName, itemsCount, destination).
 * Does NOT return items or verificationKey — those require per-checklist key auth.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email')?.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }

    // ─── Rate limit: 30 lookups / hour / IP ───
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip')?.trim() ||
      'unknown';
    if (rateLimit(`checklist-list:${clientIp}`, { windowMs: 60 * 60 * 1000, maxRequests: 30 })) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Réessayez plus tard.' },
        { status: 429 }
      );
    }

    const checklists = await db.checklist.findMany({
      where: { email },
      select: {
        code: true,
        firstName: true,
        lastName: true,
        destinationCountry: true,
        departureDate: true,
        itemsCount: true,
        emailSent: true,
        viewCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // safety cap
    });

    return NextResponse.json({
      success: true,
      email,
      count: checklists.length,
      checklists: checklists.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[checklist/list] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * POST /api/checklist
 *
 * Create a public travel inventory checklist.
 * Body:
 *   firstName, lastName, email, departureDate (yyyy-mm-dd),
 *   destinationCountry, airline?, items: [{category, name, qty, checked}]
 *
 * Flow:
 *   1. Validate input
 *   2. Generate unique 6-char code + 8-char verification key
 *   3. Persist Checklist row
 *   4. Generate PDF (Buffer)
 *   5. Send email with PDF attachment + URL + verification key
 *   6. Update Checklist (emailSent, pdfSizeBytes)
 *   7. Return { code, publicUrl }
 */
export async function POST(request: NextRequest) {
  try {
    // ─── Rate limit: 5 checklists / hour / IP ───
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip')?.trim() ||
      'unknown';
    if (rateLimit(`checklist-create:${clientIp}`, { windowMs: 60 * 60 * 1000, maxRequests: 5 })) {
      return NextResponse.json(
        { error: 'Trop de checklists créées. Réessayez dans une heure.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, email, departureDate, destinationCountry, airline, items, photoPath, photoSizeBytes } = body;

    // ─── Validation ───
    if (!firstName || typeof firstName !== 'string' || firstName.trim().length < 2) {
      return NextResponse.json({ error: 'Prénom invalide' }, { status: 400 });
    }
    if (!lastName || typeof lastName !== 'string' || lastName.trim().length < 2) {
      return NextResponse.json({ error: 'Nom invalide' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }
    if (!departureDate || !/^\d{4}-\d{2}-\d{2}$/.test(departureDate)) {
      return NextResponse.json({ error: 'Date de départ invalide (format yyyy-mm-dd)' }, { status: 400 });
    }
    if (!destinationCountry || typeof destinationCountry !== 'string' || destinationCountry.trim().length < 2) {
      return NextResponse.json({ error: 'Pays de destination invalide' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Sélectionnez au moins un article' }, { status: 400 });
    }

    // Sanitize items
    const sanitizedItems: ChecklistItem[] = items
      .filter((it: unknown): it is ChecklistItem =>
        typeof it === 'object' && it !== null &&
        typeof (it as ChecklistItem).category === 'string' &&
        typeof (it as ChecklistItem).name === 'string'
      )
      .map((it) => ({
        category: String(it.category).slice(0, 50),
        name: String(it.name).slice(0, 100),
        qty: Number.isFinite(it.qty) && it.qty > 0 ? Math.min(Math.floor(it.qty), 99) : 1,
        checked: true,
      }));

    if (sanitizedItems.length === 0) {
      return NextResponse.json({ error: 'Aucun article valide' }, { status: 400 });
    }

    // ─── Generate unique code (collision retry) ───
    let code = generateChecklistCode();
    let attempts = 0;
    while (await db.checklist.findUnique({ where: { code }, select: { id: true } })) {
      code = generateChecklistCode();
      if (++attempts > 10) {
        return NextResponse.json({ error: 'Impossible de générer un code unique' }, { status: 500 });
      }
    }

    const verificationKey = generateVerificationKey();

    // ─── Build absolute public URL ───
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'qrtagss.com';
    const baseUrl = `${protocol}://${host}`;
    const publicUrl = buildPublicChecklistUrl(code, baseUrl);

    // ─── Persist Checklist ───
    const checklist = await db.checklist.create({
      data: {
        code,
        verificationKey,
        firstName: firstName.trim().slice(0, 80),
        lastName: lastName.trim().slice(0, 80),
        email: email.trim().toLowerCase(),
        departureDate,
        destinationCountry: destinationCountry.trim().slice(0, 80),
        airline: airline?.trim()?.slice(0, 100) || null,
        items: JSON.stringify(sanitizedItems),
        itemsCount: sanitizedItems.length,
        photoPath: typeof photoPath === 'string' && photoPath.startsWith('uploads/') ? photoPath : null,
        photoSizeBytes: typeof photoSizeBytes === 'number' ? photoSizeBytes : 0,
      },
    });

    // ─── Generate PDF ───
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generateChecklistPdf({
        code,
        verificationKey,
        firstName: checklist.firstName,
        lastName: checklist.lastName,
        email: checklist.email,
        departureDate: checklist.departureDate,
        destinationCountry: checklist.destinationCountry,
        airline: checklist.airline,
        items: sanitizedItems,
        publicUrl,
        createdAt: checklist.createdAt,
      });
    } catch (pdfErr) {
      console.error('[checklist] PDF generation failed:', pdfErr);
      // Still return success — checklist is persisted, email can be re-sent later
      return NextResponse.json({
        success: true,
        code,
        publicUrl,
        warning: 'PDF generation failed. Email will be retried.',
      });
    }

    // ─── Send email with PDF attachment ───
    const template = getChecklistEmailTemplate({
      firstName: checklist.firstName,
      lastName: checklist.lastName,
      code,
      verificationKey,
      publicUrl,
      itemsCount: sanitizedItems.length,
      destination: checklist.destinationCountry,
      departureDate: checklist.departureDate,
    });

    const attachmentFilename = `QRTags-attestation-${code}.pdf`;
    const emailResult = await sendEmail({
      to: checklist.email,
      subject: `🎒 Votre attestation d'inventaire QRTags (${code})`,
      html: template.html,
      text: template.text,
      type: 'checklist',
      attachments: [
        {
          filename: attachmentFilename,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
      data: { checklistId: checklist.id, code },
    });

    // ─── Update Checklist with email + PDF metadata ───
    await db.checklist.update({
      where: { id: checklist.id },
      data: {
        emailSent: emailResult.success,
        emailSentAt: emailResult.success ? new Date() : null,
        pdfSizeBytes: pdfBuffer.length,
      },
    });

    console.log(`[checklist] ✓ Created ${code} for ${checklist.email} (${sanitizedItems.length} items, emailSent=${emailResult.success})`);

    return NextResponse.json({
      success: true,
      code,
      publicUrl,
      verificationKey, // returned to frontend for immediate display
      emailSent: emailResult.success,
      itemsCount: sanitizedItems.length,
    });
  } catch (error) {
    console.error('[checklist] POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
