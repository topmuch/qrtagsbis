import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

// ─── Zod Schemas ───

const reviewSchema = {
  name: (v: unknown) => typeof v === 'string' && v.trim().length > 0,
  rating: (v: unknown) => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5,
  content: (v: unknown) => typeof v === 'string' && v.trim().length >= 10,
};

function validateReview(data: Record<string, unknown>): string | null {
  if (!reviewSchema.name(data.name)) return 'Le nom est requis.';
  if (!reviewSchema.rating(data.rating)) return 'La note doit être un entier entre 1 et 5.';
  if (!reviewSchema.content(data.content)) return 'Le contenu doit comporter au moins 10 caractères.';
  if (data.title !== undefined && data.title !== null && typeof data.title !== 'string') {
    return 'Le titre doit être une chaîne de caractères.';
  }
  if (data.location !== undefined && data.location !== null && typeof data.location !== 'string') {
    return 'La localisation doit être une chaîne de caractères.';
  }
  return null;
}

// ─── POST /api/reviews — Submit a review ───

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 per hour per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    if (rateLimit(`review:submit:${ip}`, { windowMs: 3_600_000, maxRequests: 5 })) {
      return NextResponse.json(
        { error: 'Trop de demandes. Veuillez réessayer plus tard.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, location, rating, title, content, baggageRef, language } = body;

    // Validate
    const validationError = validateReview(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Create review (unapproved by default)
    const review = await db.review.create({
      data: {
        name: name.trim(),
        location: location?.trim() || null,
        rating: Math.round(rating),
        title: title?.trim() || null,
        content: content.trim(),
        baggageRef: baggageRef?.trim() || null,
        language: (language === 'fr' || language === 'en' || language === 'ar') ? language : 'fr',
        isApproved: false,
      },
    });

    // Return 201 — without exposing approval status to the user
    return NextResponse.json(
      {
        id: review.id,
        name: review.name,
        location: review.location,
        rating: review.rating,
        title: review.title,
        content: review.content,
        baggageRef: review.baggageRef,
        language: review.language,
        createdAt: review.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la soumission de l\'avis.' },
      { status: 500 }
    );
  }
}

// ─── GET /api/reviews — List approved reviews ───

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const limitParam = searchParams.get('limit');
    const lang = searchParams.get('lang');

    // Parse & clamp limit (default 20, max 50)
    let limit = 20;
    if (limitParam) {
      const parsed = parseInt(limitParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        limit = Math.min(parsed, 50);
      }
    }

    // Build where clause
    const where: Record<string, unknown> = { isApproved: true };
    if (featured === 'true') {
      where.isFeatured = true;
    }
    if (lang && (lang === 'fr' || lang === 'en' || lang === 'ar')) {
      where.language = lang;
    }

    // Fetch reviews + aggregate stats in parallel
    const [reviews, statsAggregate] = await Promise.all([
      db.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          name: true,
          location: true,
          rating: true,
          title: true,
          content: true,
          baggageRef: true,
          response: true,
          language: true,
          isFeatured: true,
          createdAt: true,
        },
      }),
      db.review.aggregate({
        where: { isApproved: true },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      reviews,
      stats: {
        averageRating: statsAggregate._avg.rating
          ? Math.round(statsAggregate._avg.rating * 10) / 10
          : 0,
        totalReviews: statsAggregate._count.id,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des avis.' },
      { status: 500 }
    );
  }
}