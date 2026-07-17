import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateWhatsAppMessage, analyzeScanSuspicion } from '@/lib/groq';
import { GROQ_AI_ENABLED, GROQ_SCAN_GUARD_ENABLED, GROQ_AUTO_TRANSLATE_ENABLED } from '@/lib/config';
import { isFeatureEnabled } from '@/lib/features';
import { logMetric } from '@/lib/logger';
import { detectLocaleFromHeaders, LANGUAGE_COOKIE_NAME, LANGUAGE_COOKIE_MAX_AGE_DAYS } from '@/lib/i18n';
import { detectScanContext } from '@/lib/scan-context';
import type { Language } from '@/lib/i18n';

// GET - Retrieve tag info for scan page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;

    // Try Tag model first (serialNumber), fallback to reference-like lookup
    let tag = await db.tag.findUnique({
      where: { serialNumber: reference },
      include: { agency: true }
    });

    // Fallback: try by id if serialNumber lookup fails and it looks like a cuid
    if (!tag && reference.startsWith('cm')) {
      tag = await db.tag.findUnique({
        where: { id: reference },
        include: { agency: true }
      });
    }

    if (!tag) {
      return NextResponse.json({
        status: 'not_found',
        message: 'Code QR non valide',
        theme: 'error'
      });
    }

    // Check status - redirect to activation if created
    if (tag.status === 'created') {
      return NextResponse.json({
        status: 'pending_activation',
        type: tag.tagType,
        message: 'Ce tag doit être activé',
        theme: 'tag'
      });
    }

    if (tag.status === 'blocked') {
      return NextResponse.json({
        status: 'blocked',
        message: 'Ce tag a été bloqué',
        theme: 'error'
      });
    }

    // Check expiration
    if (tag.expiresAt && new Date() > tag.expiresAt) {
      return NextResponse.json({
        status: 'expired',
        message: 'Ce tag a expiré',
        theme: 'error',
        expiredAt: tag.expiresAt.toISOString(),
        agency: tag.agency?.name || null,
        baggage: {
          type: tag.tagType,
          travelerName: tag.ownerName || 'Inconnu'
        }
      });
    }

    // Check if tag is declared lost (but not yet found)
    const isDeclaredLost = tag.declaredLostAt && !tag.foundAt;

    // AI-FEATURE: Feature #3 — Detect locale and set cookie for server-side i18n
    let detectedLocale: Language = 'fr';
    try {
      if (GROQ_AI_ENABLED && GROQ_AUTO_TRANSLATE_ENABLED) {
        const autoTranslateEnabled = await isFeatureEnabled('auto_translate').catch(() => false);
        if (autoTranslateEnabled) {
          detectedLocale = detectLocaleFromHeaders(request.headers);
        }
      }
    } catch {
      // Silent fallback to 'fr'
    }

    // Return tag info
    let theme;
    if (isDeclaredLost) {
      theme = 'lost-urgent'; // Special theme for declared lost tag
    } else {
      theme = tag.status === 'lost' ? 'lost-tag' : 'tag';
    }

    const response = NextResponse.json(
      {
        status: isDeclaredLost ? 'lost' : 'active',
        theme,
        type: tag.tagType,
        baggage: {
          reference: tag.serialNumber,
          type: tag.tagType,
          travelerName: tag.ownerName || 'Non activé',
          baggageIndex: 1,
          baggageType: tag.itemCategory || tag.tagType,
          status: tag.status,
          transportMode: 'standard',
          destination: tag.locationNote || null,
          agency: tag.agency?.name || null,
          whatsappOwner: tag.ownerPhone || null,
          declaredLostAt: tag.declaredLostAt?.toISOString() || null,
          foundAt: tag.foundAt?.toISOString() || null,
          createdAt: tag.createdAt?.toISOString() || null,
          departureDate: null,
          departureTime: null,
          itemName: tag.itemName || null,
          itemDescription: tag.itemDescription || null,
          itemCategory: tag.itemCategory || null,
          locationBuilding: tag.locationBuilding || null,
          locationRoom: tag.locationRoom || null,
        }
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );

    // AI-FEATURE: Set qrtags_locale cookie (7 days) so server can detect language on next request
    try {
      response.cookies.set(LANGUAGE_COOKIE_NAME, detectedLocale, {
        path: '/',
        maxAge: LANGUAGE_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60,
        sameSite: 'lax',
        httpOnly: false, // Client needs to read it for localStorage sync
      });
    } catch {
      // Cookie setting can fail in some environments — silent
    }

    return response;

  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Log scan and generate WhatsApp link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params;
    const body = await request.json();

    const { location, finderName, finderPhone, message, latitude, longitude, country, city, ipAddress, context: manualContext } = body;

    const tag = await db.tag.findUnique({
      where: { serialNumber: reference }
    });

    // Fallback to id
    if (!tag && reference.startsWith('cm')) {
      const tagById = await db.tag.findUnique({ where: { id: reference } });
      if (tagById) {
        // Continue with tagById
        return handleScanForTag(tagById, body, request, reference);
      }
    }

    if (!tag || !tag.ownerPhone) {
      return NextResponse.json(
        { error: 'Tag not found or not activated' },
        { status: 404 }
      );
    }

    return handleScanForTag(tag, body, request, reference);

  } catch (error) {
    console.error('Scan POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleScanForTag(
  tag: NonNullable<Awaited<ReturnType<typeof db.tag.findUnique>>>,
  body: Record<string, unknown>,
  request: NextRequest,
  reference: string
) {
  const { location, finderName, finderPhone, message, latitude, longitude, country, city, ipAddress, context: manualContext } = body as {
    location?: string;
    finderName?: string;
    finderPhone?: string;
    message?: string;
    latitude?: number;
    longitude?: number;
    country?: string;
    city?: string;
    ipAddress?: string;
    context?: string;
  };

  // AI-FEATURE: Feature #2 — Scan Guard (Anti-Doublon)
  let isFlagged = false;
  let scanGuardAnalysis: Record<string, unknown> | undefined;

  try {
    if (GROQ_AI_ENABLED && GROQ_SCAN_GUARD_ENABLED) {
      const scanGuardEnabled = await isFeatureEnabled('scan_guard').catch(() => false);
      if (scanGuardEnabled) {
        // Fetch recent scans for this tag (last 30 min)
        const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
        const recentScans = await db.scanLog.findMany({
          where: {
            tagId: tag.id,
            createdAt: { gte: thirtyMinAgo },
          },
          select: {
            ipAddress: true,
            city: true,
            country: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        const scannerIp = ipAddress ||
          request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          request.headers.get('x-real-ip')?.trim() ||
          'unknown';

        const guardResult = await analyzeScanSuspicion({
          reference: tag.serialNumber,
          scannerIp,
          userAgent: request.headers.get('user-agent') || undefined,
          city: city || undefined,
          country: country || undefined,
          recentScans: recentScans.map((s) => ({
            ip: s.ipAddress || 'unknown',
            city: s.city || undefined,
            country: s.country || undefined,
            createdAt: s.createdAt.toISOString(),
          })),
        });

        // Store analysis for ALL analyzed scans (not just flagged) for audit trail
        if (guardResult.analyzed && guardResult.analysis) {
          scanGuardAnalysis = {
            feature: 'scan_guard',
            isSuspicious: guardResult.analysis.isSuspicious,
            reason: guardResult.analysis.reason,
            confidence: guardResult.analysis.confidence,
            analyzedAt: guardResult.analysis.analyzedAt,
            latencyMs: guardResult.latencyMs,
          };

          logMetric('groq', 'scan_guard', guardResult.latencyMs, true, {
            key: reference,
            details: `flagged=${guardResult.analysis.isSuspicious}, confidence=${guardResult.analysis.confidence}, reason=${guardResult.analysis.reason.substring(0, 50)}`,
          });

          if (guardResult.analysis.isSuspicious) {
            isFlagged = true;

            // Return discreet message — don't reveal that it was flagged
            return NextResponse.json({
              success: true,
              flagged: true,
              message: 'Votre signalement est en cours de vérification.',
            });
          }
        } else {
          logMetric('groq', 'scan_guard', guardResult.latencyMs, false, {
            key: reference,
            details: 'analysis_failed',
          });
        }
      }
    }
  } catch (error) {
    // Scan guard failure = fail-open, never blocks the scan
    console.warn('[Groq/ScanGuard] Error → fail-open:', error instanceof Error ? error.message : 'unknown');
  }

  // ─── IA: Générer le message WhatsApp via Groq (si activé) ───
  let aiMessageContent: string | null = null;
  let aiGenerated = false;
  let aiLatencyMs: number | null = null;

  try {
    // ─── Double check: env var (kill switch) + DB feature flag ───
    if (!GROQ_AI_ENABLED) {
      console.log('[Groq/WhatsApp] Désactivé via GROQ_AI_ENABLED=false (env var)');
    } else {
      const groqFlag = await db.featureFlag.findUnique({
        where: { key: 'groq_api' },
        select: { enabled: true },
      });

      if (groqFlag?.enabled) {
        // AI-FEATURE: Feature #3 — Detect locale for message language
        const detectedLocale = detectLocaleFromHeaders(request.headers);
        const localeMap: Record<string, string> = { fr: 'fr-FR', en: 'en-US', ar: 'ar-SA' };
        const localeStr = localeMap[detectedLocale] || 'fr-FR';

        const scanTime = new Date().toLocaleTimeString(localeStr, {
          hour: '2-digit',
          minute: '2-digit',
        });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qrtags.com';

        const aiResult = await generateWhatsAppMessage({
          reference: tag.serialNumber,
          location: {
            city: city || tag.locationNote || 'Inconnue',
            country: country || '',
          },
          time: scanTime,
          link: `${appUrl}/suivi/${tag.serialNumber}`,
          language: detectedLocale,
        });

        if (aiResult.generated && aiResult.message) {
          aiMessageContent = aiResult.message;
          aiGenerated = true;
          aiLatencyMs = aiResult.latencyMs;
          logMetric('groq', 'generate_message', aiResult.latencyMs, true, {
            key: tag.serialNumber,
          });
        } else {
          logMetric('groq', 'generate_message', aiResult.latencyMs, false, {
            key: tag.serialNumber,
            details: 'fallback',
          });
        }
      }
    }
  } catch (error) {
    // Ne bloque JAMAIS le flux de scan — fallback silencieux
    logMetric('groq', 'generate_message', 0, false, {
      key: tag.serialNumber,
      details: error instanceof Error ? error.message : 'unknown',
    });
  }

  // ─── Détecter le contexte du scan (auto + manual override) ───
  const detectedContext = manualContext
    ? manualContext
    : detectScanContext(
        {
          destination: tag.locationNote || null,
        },
        {
          city: city || (typeof location === 'string' ? location : null),
          address: typeof location === 'string' ? location : null,
          speed: null,
          poiType: null,
        }
      ).context;

  // Create scan log with AI tracking
  await db.scanLog.create({
    data: {
      tagId: tag.id,
      location: typeof location === 'string' ? location : null,
      notes: typeof message === 'string' ? message : null,
      latitude: typeof latitude === 'number' ? latitude : null,
      longitude: typeof longitude === 'number' ? longitude : null,
      country: typeof country === 'string' ? country : null,
      city: typeof city === 'string' ? city : null,
      ipAddress: typeof ipAddress === 'string' ? ipAddress : null,
      groqUsed: aiGenerated || !!scanGuardAnalysis,
      groqLatencyMs: aiLatencyMs,
      // AI-FEATURE: Store scan guard analysis in aiAnalysis JSON
      aiAnalysis: scanGuardAnalysis ? JSON.parse(JSON.stringify(scanGuardAnalysis)) : undefined,
      // Contexte du scan
      context: detectedContext,
      // Infos du trouveur
      scannedBy: finderName?.trim() || 'finder',
      scanType: 'finder_scan',
    }
  });

  // Check if tag is declared lost (urgent case)
  const isDeclaredLost = tag.declaredLostAt && !tag.foundAt;

  // Update tag with last scan info and founder information
  const updateData: Record<string, unknown> = {
    lastScanDate: new Date(),
    lastLocation: typeof location === 'string' ? location : null,
    status: tag.status === 'activated' ? 'scanned' : tag.status,
  };

  // Store founder information if provided
  if (finderName && typeof finderName === 'string' && finderName.trim()) {
    updateData.founderName = finderName.trim();
    updateData.founderAt = new Date();
  }
  
  if (finderPhone && typeof finderPhone === 'string' && finderPhone.trim()) {
    updateData.founderPhone = finderPhone.trim();
  }

  // If tag was declared lost and founder provides info, this is an important recovery step
  // Keep the 'lost' status until agency confirms recovery

  await db.tag.update({
    where: { id: tag.id },
    data: updateData
  });

  // ─── Template de message WhatsApp envoyé au propriétaire ───
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qrtags.com';
  const trackingUrl = `${appUrl}/suivi/${reference}`;

  // [Prénom] — prénom du propriétaire
  const ownerFirstName = tag.ownerName?.trim()?.split(' ')[0] || 'à toi';

  // [Lieu] — où l'objet a été trouvé
  const lieu = city || (typeof location === 'string' ? location : '') || 'lieu non précisé';

  // [Adresse] — position précise (lien Google Maps si GPS, sinon lieu, sinon fallback)
  const address = latitude && longitude
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : (typeof location === 'string' ? location : 'non précisée');

  // [Nom] + téléphone du trouveur (avec fallbacks sûrs)
  const finderNameDisplay = (typeof finderName === 'string' && finderName.trim()) ? finderName.trim() : 'Une personne';
  const finderPhoneDisplay = (typeof finderPhone === 'string' && finderPhone.trim()) ? finderPhone.trim() : 'numéro non précisé';

  const whatsappText =
    `🎉 Bonne nouvelle ${ownerFirstName} !\n\n` +
    `Quelqu'un a trouvé votre objet à ${lieu} !\n` +
    `📍 Il est actuellement à ${address}\n` +
    `👤 La personne qui l'a trouvé s'appelle ${finderNameDisplay}\n` +
    `📞 Appelle-le vite au ${finderPhoneDisplay}\n` +
    `💬 Ou écris-lui sur WhatsApp\n` +
    `Tu peux aussi voir tous les détails ici :\n` +
    `👉 ${trackingUrl}\n` +
    `Ne panique pas, tout va bien se passer ! 💪\n` +
    `L'équipe QRTags`;

  // Clean phone number
  const phone = (tag.ownerPhone || '').replace(/[^0-9]/g, '');
  const whatsappUrl = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(whatsappText)}` : '';

  return NextResponse.json({
    success: true,
    whatsappUrl,
    isDeclaredLost,
    aiMessageUsed: false,
  });
}
