import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { rateLimit } from '@/lib/rate-limit';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'checklist-photos');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
]);

export async function POST(request: NextRequest) {
  try {
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip')?.trim() ||
      'unknown';
    if (rateLimit(`checklist-photo-upload:${clientIp}`, { windowMs: 60 * 60 * 1000, maxRequests: 10 })) {
      return NextResponse.json({ error: 'Trop de téléchargements. Réessayez plus tard.' }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Type de fichier non supporté (JPG, PNG, WEBP, GIF)' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 10 Mo)' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const safeExt = allowedExts.includes(ext) ? ext : 'jpg';
    const filename = `${randomUUID()}.${safeExt}`;
    const relativePath = `uploads/checklist-photos/${filename}`;
    const absolutePath = join(process.cwd(), relativePath);

    await mkdir(join(process.cwd(), 'uploads', 'checklist-photos'), { recursive: true });
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(absolutePath, buffer);

    return NextResponse.json({
      success: true,
      photoPath: relativePath,
      photoSizeBytes: buffer.length,
    });
  } catch (error) {
    console.error('[checklist/upload-photo] POST error:', error);
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: 'Erreur serveur lors du téléchargement', details: msg }, { status: 500 });
  }
}