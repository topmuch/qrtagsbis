/**
 * CHATBOT-KB: API Route — Chatbot Trouveur (Feature #1)
 * Agent de support intelligent avec Base de Connaissances QRTags.
 *
 * POST /api/scan/chat
 *
 * Route publique (sans auth) permettant au trouveur de poser des questions
 * contextuelles sur un objet via Groq AI, enrichi d'une KB structurée.
 *
 * Sécurité:
 *   - Rate limiting: 10 req/min par IP
 *   - Validation stricte de la référence et de la question
 *   - Kill switch: GROQ_AI_ENABLED + GROQ_CHAT_ENABLED + DB FeatureFlag 'chatbot_finder'
 *   - Sanitization HTML de la question utilisateur
 *   - Ne bloque jamais: fallback SAV si Groq échoue/timeout
 *
 * CHATBOT-KB: Modifications depuis la version initiale:
 *   - System prompts enrichis avec KB complète (tarifs, SAV, FAQ, pages, confidentialité)
 *   - Temperature 0.5 → 0.7, max_tokens 200 → 300
 *   - Timeout Groq 3s strict via Promise.race
 *   - Sanitization HTML de la question
 *   - transportMode dans le contexte objet
 *   - Réponse format: answer (au lieu de content)
 *   - Fallback orienté SAV (au lieu de "contactez le propriétaire")
 *   - Logging [Groq/Chat] sur succès
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { callGroqAI } from '@/lib/groq';
import { GROQ_AI_ENABLED, GROQ_CHAT_ENABLED } from '@/lib/config';
import { isFeatureEnabled } from '@/lib/features';
import { detectLocaleFromHeaders } from '@/lib/i18n';
import { logMetric } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { safeTransportMode } from '@/lib/transport';
import type { Language } from '@/lib/i18n';
import type { GroqMessage, GroqResult } from '@/types/ai';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════

/** CHATBOT-KB: Timeout strict pour la réponse Groq chatbot (3s) */
const CHATBOT_TIMEOUT_MS = 3000;

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

interface ChatRequestBody {
  reference: string;
  question: string;
  locale?: Language;
  baggageContext?: {
    destination?: string;
    city?: string;
    agency?: string;
    status?: string;
    // CHATBOT-KB: transportMode added for multi-transport KB context
    transportMode?: string;
  };
}

interface ChatResponse {
  success: boolean;
  fallback: boolean;
  // CHATBOT-KB: renamed from 'content' to 'answer' per spec
  answer: string;
  latencyMs: number;
  error?: string;
}

// ═══════════════════════════════════════════════════════
//  CHATBOT-KB: FALLBACK RESPONSES (orienté SAV)
// ═══════════════════════════════════════════════════════

const FALLBACK_RESPONSES: Record<Language, string> = {
  // CHATBOT-KB: Fallback orienté SAV (pas "contactez le propriétaire")
  fr: 'Je rencontre un problème technique. Veuillez contacter le SAV : support@qrtagss.com',
  en: 'I am experiencing a technical issue. Please contact support: support@qrtagss.com',
  ar: 'أواجه مشكلة تقنية. يرجى التواصل مع الدعم: support@qrtagss.com',
};

// ═══════════════════════════════════════════════════════
//  CHATBOT-KB: SYSTEM PROMPTS (KB QRTags enrichie)
//
//  Structure identique FR/EN/AR — mêmes sections, même ordre.
//  Tarifs en € non convertis. Numéro SAV au format international.
//  Liens URL bruts non traduits.
// ═══════════════════════════════════════════════════════

/**
 * CHATBOT-KB: Fonction pour construire le prompt dynamique avec KB + contexte objet.
 * @param locale - Langue de réponse
 * @param contextStr - Chaîne de contexte objet dynamique (injectée à la fin)
 */
function buildSystemPrompt(locale: Language, contextStr: string): string {
  const prompts: Record<Language, string> = {
    fr: `Tu es l'assistant QRTags, un agent de support intelligent. Réponds en français, de façon concise (max 3 phrases) et empathique. Tu connais TOUT sur QRTags.

🏛️ ENTREPRISE QRTags :
• Nom : QRTags — édité par MMASOLUTION
• Siège social : 43 Rue Maryse Bastié, 78300 Poissy, France
• Origine : Né à Dakar (Sénégal), déployé dans 15 pays
• Site web : https://qrtagss.com
• Mission : Protection intelligente des objets pour voyageurs et pèlerins
• Résaux sociaux : facebook.com/qrtags | instagram.com/qrtags | twitter.com/qrtags
• Stats : +10 000 objets protégés, +500 agences partenaires, 98% de taux de récupération

🧳 PRODUIT — COMMENT ÇA MARCHE :
• QRTags est un service de protection de objets via des autocollants QR codes uniques.
• Pas besoin d'application, pas de batterie, pas de GPS. Fonctionne avec n'importe quel téléphone.
• 4 étapes : 1) Recevez votre QR code → 2) Activez en 30 secondes → 3) Collez l'autocollant sur votre valise → 4) Si quelqu'un trouve votre objet, il scanne le QR et vous recevez une notification WhatsApp instantanée avec la localisation.
• Multi-transport : ✈️ avion, 🚆 train, 🚢 bateau, 🚌 bus
• Confidentialité RGPD : numéros et emails jamais affichés en clair. Mise en relation sécurisée via boutons. Données chiffrées.
• Pas de consigne/stockage : QRTags ne stocke pas les objets, c'est un service de mise en relation.

💰 TARIFS :
• Formule Essentiel : 4€ pour 7 jours (2 étiquettes QR, support WhatsApp, géolocalisation)
• Formule Premium : 7€ pour 1 an (2 étiquettes QR, support prioritaire 24/7, statistiques, multi-voyages)
• Paiement : Carte bancaire, Mobile Money. Livraison digitale immédiate.
• Achat : qrtagss.com/inscrire

🕌 PRODUIT HAJJ & OMRARA :
• Solution dédiée aux pèlerins (La Mecque, Médine, Djeddah)
• 3 objets inclus (1 cabine + 2 soute), géré par l'agence partenaire
• Page : qrtagss.com/hajj-omra

📄 PAGES CLÉS DU SITE :
• Accueil : qrtagss.com | Contact : qrtagss.com/contact | À propos : qrtagss.com/a-propos
• Activation voyageur : qrtagss.com/inscrire | Suivi objet : qrtagss.com/suivi/[RÉFÉRENCE]
• Devenir partenaire : qrtagss.com/devenir-partenaire | CGU : qrtagss.com/cgu

🤝 PROGRAMME PARTENAIRE :
• Ouvert aux agences de voyages, tour-opérateurs, compagnies aériennes, associations religieuses
• Revenus : jusqu'à 3€ par QR code vendu, sans investissement, service clé en main

🆘 CONTACT & SAV :
• Email : support@qrtagss.com | WhatsApp SAV : +221 78 4858226 → https://wa.me/221784858226
• Téléphone : +33 7 45 34 93 39 | Lun-Ven 9h-18h GMT, urgence 24/7
• Délai réponse : <2h. Orientations empathiques vers le SAV si hors scope ou sensible.
• IMPORTANT : Quand tu mentionnes le WhatsApp SAV, donne TOUJOURS le lien https://wa.me/221784858226 et encourage l'utilisateur à cliquer dessus.

CONTEXTE BAGAGE ACTUEL :
${contextStr}

RÈGLES :
- Réponds sur TOUT ce qui concerne QRTags : l'entreprise, le siège, l'adresse, le produit, les tarifs, le fonctionnement, les partenaires, le SAV, les pages du site.
- Si question sensible/hors scope → oriente empathiquement vers le SAV.
- Ne jamais inventer d'info non présente dans la KB ou le contexte.
- Ne jamais donner de conseil juridique ou médical.
- Pour contacter le propriétaire : utiliser les boutons WhatsApp/Phone de la page.
- IMPORTANT LIENS : Quand tu mentionnes une page du site, donne TOUJOURS l'URL COMPLETE avec https://. Exemples : https://qrtagss.com/inscrire , https://qrtagss.com/contact , https://qrtagss.com/suivi/VOL26-XXXXXX. Ne donne JAMAIS un chemin partiel.`,

    en: `You are the QRTags assistant, an intelligent support agent. Respond in English, concisely (max 3 sentences) and empathetically. You know EVERYTHING about QRTags.

🏛️ COMPANY QRTags:
• Name: QRTags — published by MMASOLUTION
• Headquarters: 43 Rue Maryse Bastié, 78300 Poissy, France
• Origin: Born in Dakar (Senegal), deployed in 15 countries
• Website: https://qrtagss.com
• Mission: Intelligent baggage protection for travelers and pilgrims
• Social media: facebook.com/qrtags | instagram.com/qrtags | twitter.com/qrtags
• Stats: 10,000+ bags protected, 500+ partner agencies, 98% recovery rate

🧳 PRODUCT — HOW IT WORKS:
• QRTags is a baggage protection service via unique QR code stickers.
• No app needed, no battery, no GPS. Works with any phone.
• 4 steps: 1) Receive QR code → 2) Activate in 30 seconds → 3) Stick label on suitcase → 4) If someone finds your bag, scan QR and owner gets instant WhatsApp alert with location.
• Multi-transport: ✈️ flight, 🚆 train, 🚢 boat, 🚌 bus
• GDPR privacy: phone/email never shown in plain text. Secure connection via buttons. End-to-end encrypted.
• No luggage storage: QRTags is a connection service, not storage.

💰 PRICING:
• Essential: 4€ for 7 days (2 QR labels, WhatsApp support, geolocation)
• Premium: 7€ for 1 year (2 QR labels, 24/7 priority, statistics, multi-trip)
• Payment: Credit card, Mobile Money. Instant digital delivery.
• Purchase: qrtagss.com/inscrire

🕌 HAJJ & UMRAH PRODUCT:
• Dedicated solution for pilgrims (Mecca, Medina, Jeddah)
• 3 bags included, managed by partner agency
• Page: qrtagss.com/hajj-omra

📄 KEY SITE PAGES:
• Homepage: qrtagss.com | Contact: qrtagss.com/contact | About: qrtagss.com/a-propos
• Traveler activation: qrtagss.com/inscrire | Tracking: qrtagss.com/suivi/[REFERENCE]
• Partner: qrtagss.com/devenir-partenaire | Terms: qrtagss.com/cgu

🤝 PARTNER PROGRAM:
• Open to travel agencies, tour operators, airlines, religious associations
• Revenue: up to 3€ per QR code sold, no investment required

🆘 CONTACT & SUPPORT:
• Email: support@qrtagss.com | WhatsApp: +221 78 4858226 → https://wa.me/221784858226
• Phone: +33 7 45 34 93 39 | Mon-Fri 9am-6pm GMT, emergency 24/7
• Response time: <2h. Empathetic redirection to support if off-scope or sensitive.
• IMPORTANT: When mentioning WhatsApp, ALWAYS include the link https://wa.me/221784858226 and encourage the user to click it.

CURRENT BAGGAGE CONTEXT:
${contextStr}

RULES:
- Respond about EVERYTHING related to QRTags: company, headquarters, address, product, pricing, how it works, partners, support, site pages.
- If sensitive/off-topic → empathetically redirect to support.
- Never invent info not in the KB or context.
- Never give legal or medical advice.
- To contact the owner: use the WhatsApp/Phone buttons on the page.
- IMPORTANT LINKS: When mentioning a site page, ALWAYS provide the FULL URL with https://. Examples: https://qrtagss.com/inscrire , https://qrtagss.com/contact , https://qrtagss.com/suivi/VOL26-XXXXXX. NEVER give a partial path.`,

    ar: `أنت مساعد QRTags، وكيل دعم ذكي. أجب باللغة العربية، بطريقة موجزة (بحد أقصى 3 جمل) وبلطف. تعرف كل شيء عن QRTags.

🏛️ شركة QRTags:
• الاسم: QRTags — تصدرها شركة MMASOLUTION
• المقر الرئيسي: 43 Rue Maryse Bastié، 78300 بواسي، فرنسا
• المنشأ: ولدت في داكار (السنغال)، منتشرة في 15 دولة
• الموقع: https://qrtagss.com
• المهمة: حماية ذكية للأمتعة للمسافرين والحجاج
• وسائل التواصل: facebook.com/qrtags | instagram.com/qrtags | twitter.com/qrtags
• إحصائيات: أكثر من 10,000 حقيبة محمية، أكثر من 500 وكالة شريكة، نسبة استرداد 98%

🧳 المنتج — كيف يعمل:
• خدمة حماية الأمتعة عبر ملصقات رموز QR فريدة.
• لا تحتاج تطبيق، لا بطارية، لا GPS. تعمل مع أي هاتف.
• 4 خطوات: 1) استلم رمز QR → 2) فعّله في 30 ثانية → 3) الصق الملصق → 4) إذا وجد شخص حقيبتك، يمسح الرمز وتتلقى إشعار واتساب فوري مع الموقع.
• وسائل نقل متعددة: ✈️ طائرة، 🚆 قطار، 🚢 سفينة، 🚌 حافلة
• خصوصية GDPR: لا تُعرض الأرقام والبريد أبداً. بيانات مشفرة.
• لا تخزين أمتعة: خدمة تواصل وليست خدمة تخزين.

💰 الأسعار:
• باقة أساسية: 4€ لمدة 7 أيام (3 ملصقات QR، دعم واتساب)
• باقة متميزة: 7€ لمدة سنة (3 ملصقات QR، دعم أولوية 24/7)
• الدفع: بطاقة ائتمان، أموال محمولة. تسليم رقمي فوري.
• الشراء: qrtagss.com/inscrire

🕌 منتج الحج والعمرة:
• حل مخصص للحجاج (مكة، المدينة، جدة)
• 3 حقائب مشمولة، تديرها الوكالة الشريكة
• الصفحة: qrtagss.com/hajj-omra

📄 صفحات الموقع الرئيسية:
• الصفحة الرئيسية: qrtagss.com | اتصل بنا: qrtagss.com/contact | من نحن: qrtagss.com/a-propos
• تفعيل المسافر: qrtagss.com/inscrire | تتبع الأمتعة: qrtagss.com/suivi/[المرجع]
• كن شريكاً: qrtagss.com/devenir-partenaire | الشروط: qrtagss.com/cgu

🤝 برنامج الشراكة:
• مفتوح لوكالات السفر، مشغلي الرحلات، شركات الطيران، الجمعيات الدينية
• إيرادات: حتى 3€ لكل رمز QR مباع، بدون استثمار

🆘 الاتصال والدعم:
• البريد: support@qrtagss.com | واتساب الدعم: +221 78 4858226 → https://wa.me/221784858226
• الهاتف: +33 7 45 34 93 39 | الاثنين-الجمعة 9ص-6م GMT، طوارئ 24/7
• وقت الرد: <2 ساعة. توجيه بلطف إلى الدعم إذا خارج النطاق.
• مهم: عند ذكر واتساب، ضع دائماً الرابط https://wa.me/221784858226 وشجّع المستخدم على النقر.

سياق الأمتعة الحالي :
${contextStr}

القواعد :
• أجب عن كل ما يتعلق بـ QRTags: الشركة، المقر، العنوان، المنتج، الأسعار، كيف يعمل، الشركاء، الدعم، صفحات الموقع.
• إذا كان السؤال حساساً/خارج النطاق → وجّه بلطف إلى الدعم.
• لا تخترع معلومات غير موجودة في المعرفة أو السياق.
• لا تقدم نصيحة قانونية أو طبية.
• للتواصل مع المالك: استخدم أزرار واتساب/الهاتف في الصفحة.
• مهم روابط: عند ذكر صفحة الموقع، ضع دائماً الرابط الكامل مع https://. أمثلة: https://qrtagss.com/inscrire , https://qrtagss.com/contact. لا تضع مساراً جزئياً.`,
  };

  return prompts[locale] || prompts.fr;
}

// ═══════════════════════════════════════════════════════
//  CHATBOT-KB: SANITIZATION
// ═══════════════════════════════════════════════════════

/**
 * CHATBOT-KB: Nettoie la question utilisateur pour éviter les injections de prompt basiques.
 * - Supprime les balises HTML
 * - Supprime les backticks (markdown)
 * // TEST: Sanitization → <script>alert('xss')</script> nettoyé
 */
function sanitizeQuestion(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')       // Strip HTML tags
    .replace(/`{3}[\s\S]*?`{3}/g, '') // Strip code blocks
    .replace(/`[^`]*`/g, '')        // Strip inline code
    .trim();
}

// ═══════════════════════════════════════════════════════
//  VALIDATION
// ═══════════════════════════════════════════════════════

function validateBody(body: unknown): { valid: true; data: ChatRequestBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body.' };
  }

  const data = body as Record<string, unknown>;

  if (!data.reference || typeof data.reference !== 'string' || data.reference.trim().length === 0) {
    return { valid: false, error: 'Reference is required.' };
  }

  if (!data.question || typeof data.question !== 'string' || data.question.trim().length === 0) {
    return { valid: false, error: 'Question is required.' };
  }

  if (data.question.trim().length > 500) {
    return { valid: false, error: 'Question too long (max 500 characters).' };
  }

  // CHATBOT-KB: Parse baggageContext with transportMode support
  const rawCtx = data.baggageContext;
  const ctx = typeof rawCtx === 'object' && rawCtx !== null ? rawCtx as Record<string, unknown> : null;

  return {
    valid: true,
    data: {
      reference: data.reference.trim(),
      question: data.question.trim().substring(0, 500),
      locale: typeof data.locale === 'string' && ['fr', 'en', 'ar'].includes(data.locale)
        ? (data.locale as Language)
        : undefined,
      baggageContext: ctx ? {
        destination: typeof ctx.destination === 'string' ? ctx.destination : undefined,
        city: typeof ctx.city === 'string' ? ctx.city : undefined,
        agency: typeof ctx.agency === 'string' ? ctx.agency : undefined,
        status: typeof ctx.status === 'string' ? ctx.status : undefined,
        // CHATBOT-KB: transportMode added
        transportMode: typeof ctx.transportMode === 'string' ? ctx.transportMode : undefined,
      } : undefined,
    },
  };
}

// ═══════════════════════════════════════════════════════
//  CHATBOT-KB: TIMEOUT WRAPPER
//  Même pattern que generateWhatsAppMessage() dans groq.ts
// // TEST: Timeout 3s → fallback silencieux si Groq lent
// ═══════════════════════════════════════════════════════

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) =>
      setTimeout(() => resolve(fallback), ms)
    ),
  ]);
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
        { success: false, error: 'Invalid JSON body.' },
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

    const { reference, question, baggageContext } = validation.data;

    // CHATBOT-KB: Sanitize question to prevent prompt injection
    const sanitizedQuestion = sanitizeQuestion(question);

    // ─── 1. Rate limiting (10 req/min par IP) ───
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';

    if (rateLimit(`chat:${clientIp}`, { windowMs: 60_000, maxRequests: 10 })) {
      return NextResponse.json(
        { success: false, error: 'Too many messages. Please wait.' },
        { status: 429 }
      );
    }

    // ─── 2. Kill switch triple check (GROQ_AI_ENABLED + GROQ_CHAT_ENABLED + DB FeatureFlag) ───
    if (!GROQ_AI_ENABLED || !GROQ_CHAT_ENABLED) {
      const locale = validation.data.locale || detectLocaleFromHeaders(request.headers);
      return NextResponse.json({
        success: true,
        fallback: true,
        answer: FALLBACK_RESPONSES[locale],
        latencyMs: Date.now() - startTime,
      } satisfies ChatResponse);
    }

    const chatbotEnabled = await isFeatureEnabled('chatbot_finder').catch(() => false);
    if (!chatbotEnabled) {
      const locale = validation.data.locale || detectLocaleFromHeaders(request.headers);
      return NextResponse.json({
        success: true,
        fallback: true,
        answer: FALLBACK_RESPONSES[locale],
        latencyMs: Date.now() - startTime,
      } satisfies ChatResponse);
    }

    // ─── 3. Fetch baggage (pour enrichir le contexte si manquant) ───
    let destination = baggageContext?.destination || '';
    let city = baggageContext?.city || '';
    let agency = baggageContext?.agency || '';
    let baggageStatus = baggageContext?.status || '';
    // CHATBOT-KB: transportMode with safe fallback
    let transportMode = baggageContext?.transportMode || '';

    if (!destination || !agency || !transportMode) {
      try {
        const baggage = await db.baggage.findUnique({
          where: { reference },
          select: {
            destination: true,
            agency: { select: { name: true } },
            status: true,
            // CHATBOT-KB: Fetch transportMode from DB
            transportMode: true,
          },
        });
        if (baggage) {
          destination = destination || baggage.destination || '';
          agency = agency || baggage.agency?.name || '';
          baggageStatus = baggageStatus || baggage.status || '';
          // CHATBOT-KB: safeTransportMode fallback for legacy data
          transportMode = transportMode || safeTransportMode(baggage.transportMode);
        }
      } catch {
        // Continue without baggage context
      }
    }

    // ─── 4. Detect locale ───
    const locale = validation.data.locale || detectLocaleFromHeaders(request.headers);

    // ─── 5. Build dynamic context string ───
    const transportLabels: Record<string, string> = {
      flight: '✈️ Avion',
      train: '🚆 Train',
      boat: '🚢 Bateau',
      bus: '🚌 Bus',
    };
    const safeMode = safeTransportMode(transportMode);

    const contextParts = [
      `Objet ${reference}`,
      transportMode ? `Mode de transport: ${transportLabels[safeMode] || safeMode}` : '',
      destination ? `Destination: ${destination}` : '',
      city ? `Dernier scan: ${city}` : '',
      agency ? `Agence: ${agency}` : '',
      baggageStatus ? `Statut: ${baggageStatus}` : '',
    ].filter(Boolean).join(', ');

    // ─── 6. Build messages with KB-enriched system prompt ───
    const systemPrompt = buildSystemPrompt(locale, contextParts);

    const messages: GroqMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: sanitizedQuestion },
    ];

    // Add history if provided — validate each entry to prevent prompt injection
    const historyPayload = rawBody as Record<string, unknown>;
    const rawHistory = historyPayload.history;
    if (Array.isArray(rawHistory) && rawHistory.length > 0) {
      const validHistory = rawHistory
        .filter((m) =>
          m && typeof m === 'object' &&
          typeof m.role === 'string' && (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' && m.content.length <= 500
        )
        .slice(-10)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: sanitizeQuestion(m.content as string).substring(0, 500),
        }));
      if (validHistory.length > 0) {
        messages.splice(1, 0, ...validHistory);
      }
    }

    // ─── 7. Call Groq with timeout 3s ───
    const timeoutFallback: GroqResult = {
      success: false,
      error: 'Chatbot timeout (3s)',
      fallback: true,
      latencyMs: CHATBOT_TIMEOUT_MS,
    };

    // CHATBOT-KB: Temperature 0.7, max_tokens 300, timeout 3s
    const result = await withTimeout(
      callGroqAI({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
      CHATBOT_TIMEOUT_MS,
      timeoutFallback,
    );

    const latencyMs = Date.now() - startTime;

    // ─── 8. Process result ───
    if (result.success && result.content) {
      const cleaned = result.content
        .replace(/^["'`]+|["'`]+$/g, '')
        .trim();

      // CHATBOT-KB: Logging [Groq/Chat] on success
      console.log(`[Groq/Chat] ${reference} → ${latencyMs}ms`);

      logMetric('groq', 'chatbot_response', latencyMs, true, {
        key: reference,
        details: `locale=${locale}, chars=${cleaned.length}`,
      });

      return NextResponse.json({
        success: true,
        fallback: false,
        answer: cleaned,
        latencyMs,
      } satisfies ChatResponse);
    }

    // Fallback
    logMetric('groq', 'chatbot_response', latencyMs, false, {
      key: reference,
      details: result.error || 'unknown',
    });

    return NextResponse.json({
      success: true,
      fallback: true,
      answer: FALLBACK_RESPONSES[locale],
      latencyMs,
    } satisfies ChatResponse);

  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error(`[Groq/Chat] ✗ Error:`, error);

    logMetric('groq', 'chatbot_response', latencyMs, false, {
      details: error instanceof Error ? error.message : 'unknown',
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
