import { NextRequest, NextResponse } from 'next/server';
import { translateText, getLanguageForCountry } from '@/lib/ai-services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLang, country } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'text requis' },
        { status: 400 }
      );
    }

    // Determine target language
    let lang = targetLang;
    if (!lang && country) {
      lang = getLanguageForCountry(country);
    }
    if (!lang) {
      lang = 'fr'; // Default to French
    }

    const result = await translateText(text, lang);

    return NextResponse.json({
      success: true,
      ...result,
      targetLang: lang
    });
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la traduction' },
      { status: 500 }
    );
  }
}

// GET endpoint for language detection
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');

  if (!country) {
    return NextResponse.json(
      { error: 'country requis' },
      { status: 400 }
    );
  }

  const lang = getLanguageForCountry(country);

  return NextResponse.json({
    success: true,
    country,
    language: lang
  });
}
