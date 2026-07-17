/**
 * API Route — Scan → Notify automatique (sans auth, côté client)
 *
 * POST /api/scan/notify
 *
 * Flux complet :
 *   1. Rate limit (3 req/min par référence)
 *   2. Récupérer les infos du objet
 *   3. Générer le message WhatsApp via Groq (si activé)
 *   4. Envoyer via Wakit (si configuré)
 *   5. Logger dans ScanLog
 *
 * Sécurité:
 *   - Rate limiting par référence objet
 *   - Validation stricte des entrées
 *   - Ne bloque jamais le flux (fallback gracieux)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateWhatsAppMessage } from '@/lib/groq';
import { sendWakitMessage } from '@/lib/wakit';
import { GROQ_AI_ENABLED, GROQ_MODEL_CHAT } from '@/lib/config';
import { logMetric } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { detectLanguageFromCountry } from '@/lib/i18n';
import { safeTransportMode, TRANSPORT_ICONS } from '@/lib/transport';
import type { Language } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════

/** Mapping langue → locale pour toLocaleTimeString */
const LOCALE_MAP: Record<Language, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  ar: 'ar-SA',
};

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

interface NotifyRequestBody {
  reference: string;
  scannerIp?: string;
  location?: {
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  finderName?: string;
  finderPhone?: string;
  message?: string;
}

// ═══════════════════════════════════════════════════════
//  VALIDATION
// ═══════════════════════════════════════════════════════

function validateBody(body: unknown): { valid: true; data: NotifyRequestBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Corps de requête invalide.' };
  }

  const data = body as Record<string, unknown>;

  if (!data.reference || typeof data.reference !== 'string' || data.reference.trim().length === 0) {
    return { valid: false, error: 'Le champ "reference" est requis.' };
  }

  return {
    valid: true,
    data: {
      reference: data.reference.trim(),
      scannerIp: typeof data.scannerIp === 'string' ? data.scannerIp : undefined,
      location: typeof data.location === 'object' && data.location !== null
        ? {
            city: (data.location as Record<string, unknown>).city as string | undefined,
            country: (data.location as Record<string, unknown>).country as string | undefined,
            latitude: typeof (data.location as Record<string, unknown>).latitude === 'number'
              ? (data.location as Record<string, unknown>).latitude as number : undefined,
            longitude: typeof (data.location as Record<string, unknown>).longitude === 'number'
              ? (data.location as Record<string, unknown>).longitude as number : undefined,
          }
        : undefined,
      finderName: typeof data.finderName === 'string' ? data.finderName : undefined,
      finderPhone: typeof data.finderPhone === 'string' ? data.finderPhone : undefined,
      message: typeof data.message === 'string' ? data.message : undefined,
    },
  };
}

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Détecte la langue depuis les headers Accept-Language.
 * Fallback vers la détection par pays, puis 'fr'.
 */
function detectLanguageFromHeaders(acceptLanguage: string | null, countryCode?: string): Language {
  if (acceptLanguage) {
    const lang = acceptLanguage.split(',')[0]?.split('-')[0]?.trim().toLowerCase();
    if (lang === 'fr' || lang === 'en' || lang === 'ar') {
      return lang;
    }
  }

  if (countryCode) {
    return detectLanguageFromCountry(countryCode);
  }

  return 'fr';
}

/**
 * Détecte l'IP du scanner depuis les headers ou le body.
 */
function detectScannerIp(request: NextRequest, bodyIp?: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return bodyIp || 'unknown';
}

// ═══════════════════════════════════════════════════════
//  POST HANDLER
// ═══════════════════════════════════════════════════════

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // ─── Parse body ───
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Corps de requête JSON invalide.' },
        { status: 400 }
      );
    }

    const validation = validateBody(rawBody);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { reference, location, finderName, finderPhone, message } = validation.data;
    const scannerIp = detectScannerIp(request, validation.data.scannerIp);

    // ─── 1. Rate limiting (3 requêtes / minute par référence) ───
    if (rateLimit(`notify:${reference}`, { windowMs: 60_000, maxRequests: 3 })) {
      console.warn(`[Notify API] Rate limit dépassé pour ${reference}`);
      return NextResponse.json(
        { success: false, error: 'Trop de requêtes. Réessayez dans une minute.' },
        { status: 429 }
      );
    }

    // ─── 2. Récupérer les infos du objet ───
    const baggage = await db.baggage.findUnique({
      where: { reference },
    });

    if (!baggage) {
      return NextResponse.json(
        { success: false, error: 'Objet non trouvé.' },
        { status: 404 }
      );
    }

    // TRANSPORT-NOTIFY: Extraire le mode de transport après null check
    const transportMode = safeTransportMode(baggage.transportMode);

    if (!baggage.whatsappOwner) {
      return NextResponse.json(
        { success: false, error: 'Aucun numéro WhatsApp configuré pour ce objet.' },
        { status: 400 }
      );
    }

    // Vérifier que le objet est actif (pas en attente, pas bloqué, pas expiré)
    if (baggage.status === 'pending_activation') {
      return NextResponse.json(
        { success: false, error: 'Ce objet n\'est pas encore activé.' },
        { status: 400 }
      );
    }

    if (baggage.status === 'blocked') {
      return NextResponse.json(
        { success: false, error: 'Ce objet a été bloqué.' },
        { status: 403 }
      );
    }

    if (baggage.expiresAt && new Date() > baggage.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Ce objet a expiré.' },
        { status: 410 }
      );
    }

    // ─── 3. Générer le message WhatsApp via Groq (si activé) ───
    let messageContent = '';
    let messageSource: 'groq' | 'fallback' = 'fallback';
    let groqLatencyMs: number | null = null;
    let groqModelUsed: string | null = null;

    try {
      // Double check: env var (kill switch) + DB feature flag
      if (GROQ_AI_ENABLED) {
        const groqFlag = await db.featureFlag.findUnique({
          where: { key: 'groq_api' },
          select: { enabled: true },
        });

        if (groqFlag?.enabled) {
          const language = detectLanguageFromHeaders(
            request.headers.get('accept-language'),
            location?.country
          );
          const locale = LOCALE_MAP[language];

          const scanTime = new Date().toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit',
          });

          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qrtagss.com';

          const aiResult = await generateWhatsAppMessage({
            reference: baggage.reference,
            location: {
              city: location?.city || baggage.destination || 'Inconnue',
              country: location?.country || '',
            },
            time: scanTime,
            link: `${appUrl}/suivi/${baggage.reference}`,
            language,
            // TRANSPORT-NOTIFY: Passer le mode de transport pour différencier le message
            transportMode,
          });

          if (aiResult.generated && aiResult.message) {
            messageContent = aiResult.message;
            messageSource = 'groq';
            groqLatencyMs = aiResult.latencyMs;
            groqModelUsed = GROQ_MODEL_CHAT || 'llama-3.3-70b-versatile';

            logMetric('groq', 'generate_message', aiResult.latencyMs, true, {
              key: baggage.reference,
              details: `lang=${language}`,
            });
          } else {
            logMetric('groq', 'generate_message', aiResult.latencyMs, false, {
              key: baggage.reference,
              details: 'fallback',
            });
          }
        }
      }
    } catch (error) {
      // Ne bloque JAMAIS le flux de scan — fallback silencieux
      logMetric('groq', 'generate_message', 0, false, {
        key: baggage.reference,
        details: error instanceof Error ? error.message : 'unknown',
      });
    }

    // 3b. Fallback statique si Groq désactivé ou échec
    if (!messageContent) {
      const fallbackLocale = LOCALE_MAP[detectLanguageFromHeaders(
        request.headers.get('accept-language'),
        location?.country
      )];
      const scanTime = new Date().toLocaleTimeString(fallbackLocale, {
        hour: '2-digit',
        minute: '2-digit',
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qrtagss.com';

      // TRANSPORT-NOTIFY: Fallback statique adapté au mode de transport
      const transportEmoji = TRANSPORT_ICONS[transportMode];
      const transportLabels: Record<string, Record<Language, string>> = {
        flight: { fr: 'vol', en: 'flight', ar: 'رحلة طيران' },
        train:  { fr: 'train', en: 'train', ar: 'قطار' },
        boat:   { fr: 'traversée maritime', en: 'boat crossing', ar: 'رحلة بحرية' },
        bus:    { fr: 'voyage en bus', en: 'bus trip', ar: 'رحلة حافلة' },
      };
      const fallbackLang = detectLanguageFromHeaders(
        request.headers.get('accept-language'),
        location?.country
      );
      const transportLabel = transportLabels[transportMode]?.[fallbackLang] || 'vol';

      messageContent = [
        `${transportEmoji} Alerte QRTags`,
        `Votre objet ${baggage.reference} (${transportLabel}) a été scanné à ${location?.city || 'une localisation inconnue'} à ${scanTime}.`,
        `Suivez son statut : ${appUrl}/suivi/${baggage.reference}`,
      ].join('\n');

      messageSource = 'fallback';
    }

    // Enrichir avec les infos du trouveur
    const finderParts: string[] = [];
    if (finderName) finderParts.push(`👤 Trouvé par: ${finderName}`);
    if (finderPhone) finderParts.push(`📱 Contact: ${finderPhone}`);
    if (location?.latitude && location?.longitude) {
      finderParts.push(`📍 Position: https://www.google.com/maps?q=${location.latitude},${location.longitude}`);
    } else if (location?.city) {
      finderParts.push(`📍 Lieu: ${location.city}`);
    }
    if (message) finderParts.push(`💬 ${message}`);

    if (finderParts.length > 0) {
      messageContent += '\n' + finderParts.join('\n');
    }

    // ─── 4. Envoi via Wakit (si configuré) ───
    let wakitMessageId: string | null = null;
    let whatsappStatus: string = 'fallback';

    try {
      const wakitLocale = LOCALE_MAP[detectLanguageFromHeaders(
        request.headers.get('accept-language'),
        location?.country
      )];

      // TRANSPORT-NOTIFY: Inclure le mode de transport dans les variables Wakit
      const transportLabelsWakit: Record<string, Record<Language, string>> = {
        flight: { fr: 'vol', en: 'flight', ar: 'رحلة طيران' },
        train:  { fr: 'train', en: 'train', ar: 'قطار' },
        boat:   { fr: 'traversée maritime', en: 'boat crossing', ar: 'رحلة بحرية' },
        bus:    { fr: 'voyage en bus', en: 'bus trip', ar: 'رحلة حافلة' },
      };
      const wakitLang = detectLanguageFromHeaders(
        request.headers.get('accept-language'),
        location?.country
      );

      const wakitResult = await sendWakitMessage({
        to: baggage.whatsappOwner,
        template: 'baggage_scan_alert',
        variables: {
          reference: baggage.reference,
          location: location?.city || baggage.destination || 'Inconnue',
          time: new Date().toLocaleTimeString(wakitLocale, { hour: '2-digit', minute: '2-digit' }),
          link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://qrtagss.com'}/suivi/${baggage.reference}`,
          transport_mode: `${TRANSPORT_ICONS[transportMode]} ${transportLabelsWakit[transportMode]?.[wakitLang] || 'vol'}`,
        },
      });

      if (wakitResult.success) {
        wakitMessageId = wakitResult.messageId || null;
        whatsappStatus = wakitResult.status || 'sent';

        logMetric('wakit', 'message.sent', wakitResult.latencyMs ?? 0, true, {
          key: baggage.reference,
          details: `id=${wakitMessageId}`,
        });
      } else {
        whatsappStatus = wakitResult.fallback ? 'fallback' : 'failed';

        logMetric('wakit', 'message.sent', wakitResult.latencyMs ?? 0, false, {
          key: baggage.reference,
          details: wakitResult.error || 'unknown',
        });
      }
    } catch (error) {
      whatsappStatus = 'failed';

      logMetric('wakit', 'message.sent', 0, false, {
        key: baggage.reference,
        details: error instanceof Error ? error.message : 'unknown',
      });
    }

    // ─── 5. Logger dans ScanLog ───
    // Stocker le message IA généré dans aiAnalysis pour audit trail
    const aiAnalysisData = messageSource === 'groq'
      ? { type: 'whatsapp_message' as const, source: 'groq' as const, content: messageContent.substring(0, 1000) }
      : undefined;

    await db.scanLog.create({
      data: {
        baggageId: baggage.id,
        location: location?.city || baggage.destination || null,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        country: location?.country || null,
        city: location?.city || null,
        ipAddress: scannerIp,
        message: finderName || finderPhone || message || null,
        whatsappStatus,
        groqUsed: messageSource === 'groq',
        groqLatencyMs,
        aiMessageUsed: messageSource === 'groq',
        groqModelUsed,
        wakitMessageId,
        aiAnalysis: aiAnalysisData ? JSON.parse(JSON.stringify(aiAnalysisData)) : undefined,
      },
    });

    // ─── 6. Mettre à jour le objet (dernier scan) ───
    await db.baggage.update({
      where: { id: baggage.id },
      data: {
        lastScanDate: new Date(),
        lastLocation: location?.city || baggage.destination || null,
        status: baggage.status === 'active' ? 'scanned' : baggage.status,
      },
    });

    const totalLatencyMs = Date.now() - startTime;

    // ─── 7. Réponse ───
    return NextResponse.json({
      success: true,
      reference: baggage.reference,
      messageSource,         // 'groq' ou 'fallback' — pour debug
      whatsappStatus,        // 'sent' | 'delivered' | 'failed' | 'fallback'
      wakitMessageId: wakitMessageId || undefined,
      groqLatencyMs: groqLatencyMs || undefined,
      totalLatencyMs,
      // Message complet (IA + infos trouveur) — utilisable comme fallback wa.me
      messageContent: messageContent || undefined,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    console.error(`[Notify API] ✗ Erreur: ${message}`);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}
