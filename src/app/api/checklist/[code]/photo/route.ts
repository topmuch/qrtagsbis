import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

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

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip')?.trim() ||
      'unknown';
    if (rateLimit(`checklist-photo:${code}:${clientIp}`, { windowMs: 60 * 60 * 1000, maxRequests: 30 })) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
    }

    const checklist = await db.checklist.findUnique({
      where: { code: code.toUpperCase() },
      select: { code: true, verificationKey: true, photoPath: true },
    });

    if (!checklist) {
      return NextResponse.json({ error: 'Attestation introuvable' }, { status: 404 });
    }

    if (providedKey !== checklist.verificationKey) {
      return NextResponse.json({ error: 'Clé de vérification incorrecte' }, { status: 403 });
    }

    if (!checklist.photoPath) {
      return NextResponse.json({ error: 'Aucune photo associée' }, { status: 404 });
    }

    const absolutePath = join(process.cwd(), checklist.photoPath);
    if (!existsSync(absolutePath)) {
      return NextResponse.json({ error: 'Fichier photo introuvable' }, { status: 404 });
    }

    const fileBuffer = await readFile(absolutePath);
    const fileStat = await stat(absolutePath);

    const ext = absolutePath.split('.').pop()?.toLowerCase();
    const contentType = ext === 'png' ? 'image/png'
      : ext === 'gif' ? 'image/gif'
      : ext === 'webp' ? 'image/webp'
      : 'image/jpeg';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileStat.size),
        'Content-Disposition': `inline; filename="photo-valise-${checklist.code}.${ext}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[checklist/[code]/photo] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}