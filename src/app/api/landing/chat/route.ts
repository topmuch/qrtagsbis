/**
 * LANDING CHATBOT: API Route — Chatbot Page d'Accueil (Guest Mode)
 *
 * POST /api/landing/chat
 *
 * Route publique (sans auth) pour le chatbot de la landing page.
 * Version simplifiée du /api/scan/chat SANS référence requise.
 *
 * Sécurité:
 *   - Rate limiting: 10 req/min par IP
 *   - Validation stricte de la question
 *   - Kill switch: GROQ_AI_ENABLED
 *   - Sanitization HTML de la question utilisateur
 *   - Ne bloque jamais: fallback SAV si Groq échoue/timeout
 *
 * Fonctionnalités:
 *   - Réponses IA avec KB complète QRTags (tarifs, FAQ, contact, pages)
 *   - Détection dynamique de référence pour génération de lien de suivi
 *   - Support trilingue: fr/en/ar
 */

import { NextRequest, NextResponse } from 'next/server';
import { callGroqAI } from '@/lib/groq';
import { GROQ_AI_ENABLED } from '@/lib/config';
import { logMetric } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import type { Language } from '@/lib/i18n';
import type { GroqMessage, GroqResult } from '@/types/ai';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════

/** Timeout strict pour la réponse Groq chatbot (3s) */
const CHATBOT_TIMEOUT_MS = 3000;

/** Regex pour détecter une référence QRTags (ex: VOL26-XXXXXX) */
const REFERENCE_REGEX = /[A-Z]{2,4}\d{2}-[A-Z0-9]{6}/;

/** Mots-clés de suivi par langue */
const TRACKING_KEYWORDS: Record<string, RegExp> = {
  fr: /\b(suivi|objet|où|lien|track|localis|trouv|perd|valise|ma\s*valise|mon\s*objet)\b/i,
  en: /\b(track|baggage|where|link|locate|find|lost|suitcase|my\s*bag)\b/i,
  ar: /\b(أين|متابعة|حقيبة|وجدت|فقدت|أمتعة|رابط)\b/i,
};

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

interface ChatRequestBody {
  question: string;
  locale?: Language;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

interface ChatResponse {
  success: boolean;
  answer?: string;
  trackingLink?: string;
  askReference?: boolean;
  fallback?: boolean;
  latencyMs?: number;
  error?: string;
}

// ═══════════════════════════════════════════════════════
//  FALLBACK RESPONSES (orienté SAV)
// ═══════════════════════════════════════════════════════

const FALLBACK_RESPONSES: Record<Language, string> = {
  fr: 'Je rencontre un problème technique. Veuillez contacter le SAV : info@qrtagss.com',
  en: 'I am experiencing a technical issue. Please contact support: info@qrtagss.com',
  ar: 'أواجه مشكلة تقنية. يرجى التواصل مع الدعم: info@qrtagss.com',
};

// ═══════════════════════════════════════════════════════
//  SYSTEM PROMPTS (KB QRTags — Landing/Guest Mode)
// ═══════════════════════════════════════════════════════

function buildSystemPrompt(locale: Language): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qrtagss.com';

  const prompts: Record<Language, string> = {
    fr: `Tu es l'assistant QRTags, un agent de support intelligent sur la page d'accueil. Réponds en français, de façon concise (max 3 phrases) et empathique. Tu connais TOUT sur QRTags.

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
• 4 étapes : 1) Recevez votre QR code → 2) Activez en 30 secondes (nom, vol, destination) → 3) Collez l'autocollant sur votre valise → 4) Si quelqu'un trouve votre objet, il scanne le QR et vous recevez une notification WhatsApp instantanée avec la localisation.
• Multi-transport : ✈️ avion, 🚆 train, 🚢 bateau, 🚌 bus
• Confidentialité RGPD : numéros et emails jamais affichés en clair. Mise en relation sécurisée via boutons. Données chiffrées de bout en bout.
• Pas de consigne/stockage : QRTags ne stocke pas les objets, c'est un service de mise en relation.

💰 TARIFS :
• Formule Essentiel : 4€ pour 7 jours (2 étiquettes QR, support WhatsApp, géolocalisation)
• Formule Premium : 7€ pour 1 an (2 étiquettes QR, support prioritaire 24/7, statistiques de scan, multi-voyages)
• Paiement : Carte bancaire, Mobile Money. Livraison digitale immédiate.
• Achat : ${appUrl}/inscrire

🕌 PRODUIT HAJJ & OMRARA :
• Solution dédiée aux pèlerins (La Mecque, Médine, Djeddah)
• 3 objets inclus (1 cabine + 2 soute), géré par l'agence partenaire
• Notifications WhatsApp même avec connectivité limitée
• Page : ${appUrl}/hajj-omra

📄 PAGES CLÉS DU SITE :
• Accueil : ${appUrl}
• Contact : ${appUrl}/contact
• À propos : ${appUrl}/a-propos
• Activation voyageur : ${appUrl}/inscrire
• Activation Hajj : ${appUrl}/hajj/activate
• Suivi objet : ${appUrl}/suivi/[RÉFÉRENCE]
• Devenir partenaire : ${appUrl}/devenir-partenaire
• Voyageurs standard : ${appUrl}/voyageurs-standard
• CGU : ${appUrl}/cgu
• Confidentialité : ${appUrl}/confidentialité
• Mentions légales : ${appUrl}/mentions-legales

🤝 PROGRAMME PARTENAIRE :
• Ouvert aux agences de voyages, tour-opérateurs, compagnies aériennes, associations religieuses
• Revenus : jusqu'à 3€ par QR code vendu, sans investissement
• Service clé en main : QR codes, dashboard agence, support 24/7
• Devis personnalisé sous 24h : ${appUrl}/devenir-partenaire

🆘 CONTACT & SAV :
• Email général : contact@qrtags.com
• Email SAV : info@qrtagss.com
• Téléphone : +33 7 45 34 93 39
• WhatsApp principal : +33 7 45 34 93 39 → https://wa.me/33745349339
• WhatsApp SAV : +221 78 4858226 → https://wa.me/221784858226
• Horaires : Lun-Ven 9h-18h, support d'urgence 24/7
• Délai réponse : <2h pour le SAV, sous 24h pour le formulaire de contact
• IMPORTANT : Quand tu mentionnes le WhatsApp, donne TOUJOURS le lien https://wa.me/221784858226 ou https://wa.me/33745349339 et encourage l'utilisateur à cliquer dessus.

RÈGLES :
- Réponds sur TOUT ce qui concerne QRTags : l'entreprise, le siège, l'adresse, le produit, les tarifs, le fonctionnement, les partenaires, le SAV, les pages du site.
- Si question sensible/hors scope → oriente empathiquement vers le SAV.
- Ne jamais inventer d'info non présente dans cette base de connaissances.
- Ne jamais donner de conseil juridique ou médical.
- Si l'utilisateur demande un lien de suivi, demande-lui sa référence QR (format: VOL26-XXXXXX).
- IMPORTANT LIENS : Quand tu mentionnes une page du site (suivi, inscription, contact, etc.), donne TOUJOURS l'URL COMPLETE avec https://. Exemples : https://qrtagss.com/inscrire , https://qrtagss.com/contact , https://qrtagss.com/suivi/VOL26-XXXXXX. Ne donne JAMAIS un chemin partiel comme "/inscrire" seul.`,

    en: `You are the QRTags assistant, an intelligent support agent on the landing page. Respond in English, concisely (max 3 sentences) and empathetically. You know EVERYTHING about QRTags.

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
• 4 steps: 1) Receive your QR code → 2) Activate in 30 seconds (name, flight, destination) → 3) Stick the label on your suitcase → 4) If someone finds your bag, they scan the QR and you get an instant WhatsApp notification with the location.
• Multi-transport: ✈️ flight, 🚆 train, 🚢 boat, 🚌 bus
• GDPR privacy: phone numbers and emails never shown in plain text. Secure connection via buttons. End-to-end encrypted data.
• No luggage storage: QRTags is a connection service, not a storage service.

💰 PRICING:
• Essential plan: 4€ for 7 days (2 QR labels, WhatsApp support, geolocation)
• Premium plan: 7€ for 1 year (2 QR labels, 24/7 priority support, scan statistics, multi-trip)
• Payment: Credit card, Mobile Money. Instant digital delivery.
• Purchase: ${appUrl}/inscrire

🕌 HAJJ & UMRAH PRODUCT:
• Dedicated solution for pilgrims (Mecca, Medina, Jeddah)
• 3 bags included (1 cabin + 2 checked), managed by partner agency
• WhatsApp notifications even with limited connectivity
• Page: ${appUrl}/hajj-omra

📄 KEY SITE PAGES:
• Homepage: ${appUrl}
• Contact: ${appUrl}/contact
• About: ${appUrl}/a-propos
• Traveler activation: ${appUrl}/inscrire
• Hajj activation: ${appUrl}/hajj/activate
• Baggage tracking: ${appUrl}/suivi/[REFERENCE]
• Become a partner: ${appUrl}/devenir-partenaire
• Standard travelers: ${appUrl}/voyageurs-standard
• Terms: ${appUrl}/cgu
• Privacy: ${appUrl}/confidentialite
• Legal notices: ${appUrl}/mentions-legales

🤝 PARTNER PROGRAM:
• Open to travel agencies, tour operators, airlines, religious associations
• Revenue: up to 3€ per QR code sold, no investment required
• Turnkey service: QR codes, agency dashboard, 24/7 support
• Personalized quote within 24h: ${appUrl}/devenir-partenaire

🆘 CONTACT & SUPPORT:
• General email: contact@qrtags.com
• Support email: info@qrtagss.com
• Phone: +33 7 45 34 93 39
• Main WhatsApp: +33 7 45 34 93 39 → https://wa.me/33745349339
• Support WhatsApp: +221 78 4858226 → https://wa.me/221784858226
• Hours: Mon-Fri 9am-6pm, emergency support 24/7
• Response time: <2h for support, within 24h for contact form
• IMPORTANT: When mentioning WhatsApp, ALWAYS include the link https://wa.me/221784858226 or https://wa.me/33745349339 and encourage the user to click it.

RULES:
- Respond about EVERYTHING related to QRTags: the company, headquarters, address, product, pricing, how it works, partners, support, site pages.
- If sensitive/off-topic question → empathetically redirect to support.
- Never invent info not in this knowledge base.
- Never give legal or medical advice.
- If the user asks for a tracking link, ask for their QR reference (format: VOL26-XXXXXX).
- IMPORTANT LINKS: When mentioning a site page (tracking, signup, contact, etc.), ALWAYS provide the FULL URL with https://. Examples: https://qrtagss.com/inscrire , https://qrtagss.com/contact , https://qrtagss.com/suivi/VOL26-XXXXXX. NEVER give a partial path like "/inscrire" alone.`,

    ar: `أنت مساعد QRTags، وكيل دعم ذكي على الصفحة الرئيسية. أجب باللغة العربية، بطريقة موجزة (بحد أقصى 3 جمل) وبلطف. تعرف كل شيء عن QRTags.

🏛️ شركة QRTags:
• الاسم: QRTags — تصدرها شركة MMASOLUTION
• المقر الرئيسي: 43 Rue Maryse Bastié، 78300 بواسي، فرنسا
• المنشأ: ولدت في داكار (السنغال)، منتشرة في 15 دولة
• الموقع: https://qrtagss.com
• المهمة: حماية ذكية للأمتعة للمسافرين والحجاج
• وسائل التواصل: facebook.com/qrtags | instagram.com/qrtags | twitter.com/qrtags
• إحصائيات: أكثر من 10,000 حقيبة محمية، أكثر من 500 وكالة شريكة، نسبة استرداد 98%

🧳 المنتج — كيف يعمل:
• QRTags هي خدمة حماية الأمتعة عبر ملصقات رموز QR فريدة.
• لا تحتاج تطبيق، لا بطارية، لا GPS. تعمل مع أي هاتف.
• 4 خطوات: 1) استلم رمز QR → 2) فعّله في 30 ثانية (الاسم، الرحلة، الوجهة) → 3) الصق الملصق على حقيبتك → 4) إذا وجد شخص حقيبتك، يمسح الرمز وتتلقى إشعار واتساب فوري مع الموقع.
• وسائل نقل متعددة: ✈️ طائرة، 🚆 قطار، 🚢 سفينة، 🚌 حافلة
• خصوصية GDPR: لا تُعرض الأرقام والبريد أبداً. تواصل آمن عبر أزرار. بيانات مشفرة من طرف لطرف.
• لا تخزين أمتعة: QRTags خدمة تواصل وليست خدمة تخزين.

💰 الأسعار:
• باقة أساسية: 4€ لمدة 7 أيام (3 ملصقات QR، دعم واتساب، تحديد الموقع)
• باقة متميزة: 7€ لمدة سنة (3 ملصقات QR، دعم أولوية 24/7، إحصائيات المسح، رحلات متعددة)
• الدفع: بطاقة ائتمان، أموال محمولة. تسليم رقمي فوري.
• الشراء: ${appUrl}/inscrire

🕌 منتج الحج والعمرة:
• حل مخصص للحجاج (مكة، المدينة، جدة)
• 3 حقائب مشمولة (1 مقصورة + 2 شحن)، تديرها الوكالة الشريكة
• إشعارات واتساب حتى مع اتصال محدود
• الصفحة: ${appUrl}/hajj-omra

📄 صفحات الموقع الرئيسية:
• الصفحة الرئيسية: ${appUrl}
• اتصل بنا: ${appUrl}/contact
• من نحن: ${appUrl}/a-propos
• تفعيل المسافر: ${appUrl}/inscrire
• تفعيل الحج: ${appUrl}/hajj/activate
• تتبع الأمتعة: ${appUrl}/suivi/[المرجع]
• كن شريكاً: ${appUrl}/devenir-partenaire
• المسافرون: ${appUrl}/voyageurs-standard
• الشروط: ${appUrl}/cgu
• الخصوصية: ${appUrl}/confidentialite
• الإشعارات القانونية: ${appUrl}/mentions-legales

🤝 برنامج الشراكة:
• مفتوح لوكالات السفر، مشغلي الرحلات، شركات الطيران، الجمعيات الدينية
• الإيرادات: حتى 3€ لكل رمز QR مباع، بدون استثمار
• خدمة جاهزة: رموز QR، لوحة تحكم الوكالة، دعم 24/7
• عرض أسعار مخصص خلال 24 ساعة: ${appUrl}/devenir-partenaire

🆘 الاتصال والدعم:
• البريد العام: contact@qrtags.com
• بريد الدعم: info@qrtagss.com
• الهاتف: +33 7 45 34 93 39
• واتساب رئيسي: +33 7 45 34 93 39 → https://wa.me/33745349339
• واتساب الدعم: +221 78 4858226 → https://wa.me/221784858226
• الساعات: الاثنين-الجمعة 9ص-6م، دعم طوارئ 24/7
• وقت الرد: أقل من ساعتين للدعم، خلال 24 ساعة لنموذج الاتصال
• مهم: عند ذكر واتساب، ضع دائماً الرابط https://wa.me/221784858226 أو https://wa.me/33745349339 وشجّع المستخدم على النقر.

القواعد:
• أجب عن كل ما يتعلق بـ QRTags: الشركة، المقر، العنوان، المنتج، الأسعار، كيف يعمل، الشركاء، الدعم، صفحات الموقع.
• إذا كان السؤال حساساً/خارج النطاق → وجّه بلطف إلى الدعم.
• لا تخترع أبداً معلومات غير موجودة في قاعدة المعرفة.
• لا تقدم نصيحة قانونية أو طبية.
• إذا طلب المستخدم رابط تتبع، اطلب منه مرجع QR (الصيغة: VOL26-XXXXXX).
• مهم روابط: عند ذكر صفحة الموقع، ضع دائماً الرابط الكامل مع https://. أمثلة: https://qrtagss.com/inscrire , https://qrtagss.com/contact. لا تضع مساراً جزئياً.`,
  };

  return prompts[locale] || prompts.fr;
}

// ═══════════════════════════════════════════════════════
//  SANITIZATION
// ═══════════════════════════════════════════════════════

function sanitizeQuestion(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/`{3}[\s\S]*?`{3}/g, '')
    .replace(/`[^`]*`/g, '')
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

  if (!data.question || typeof data.question !== 'string' || data.question.trim().length === 0) {
    return { valid: false, error: 'Question is required.' };
  }

  if (data.question.trim().length > 500) {
    return { valid: false, error: 'Question too long (max 500 characters).' };
  }

  return {
    valid: true,
    data: {
      question: data.question.trim().substring(0, 500),
      locale: typeof data.locale === 'string' && ['fr', 'en', 'ar'].includes(data.locale)
        ? (data.locale as Language)
        : undefined,
    },
  };
}

// ═══════════════════════════════════════════════════════
//  TRACKING LINK DETECTION
// ═══════════════════════════════════════════════════════

/**
 * Détecte si la question porte sur le suivi de objet et extrait la référence.
 * Retourne null si ce n'est pas une question de suivi.
 */
function detectTrackingRequest(
  question: string,
  locale: Language
): { type: 'link'; reference: string } | { type: 'ask_reference' } | null {
  const trackingRegex = TRACKING_KEYWORDS[locale] || TRACKING_KEYWORDS.fr;
  if (!trackingRegex.test(question)) return null;

  // Chercher une référence dans la question
  const refMatch = question.match(REFERENCE_REGEX);
  if (refMatch) {
    const ref = refMatch[0];
    // Validation supplémentaire: au moins 2 lettres suivies de 2+ chiffres, tiret, 6 alphanum
    if (/^[A-Z]{2,4}\d{2}-[A-Z0-9]{6}$/.test(ref)) {
      return { type: 'link', reference: ref };
    }
    // Référence trouvée mais invalide
    return { type: 'ask_reference' };
  }

  // Mots-clés de suivi trouvés mais pas de référence → la demander
  return { type: 'ask_reference' };
}

// ═══════════════════════════════════════════════════════
//  TIMEOUT WRAPPER
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

    const { question } = validation.data;

    // Sanitize question
    const sanitizedQuestion = sanitizeQuestion(question);

    // ─── 1. Rate limiting (10 req/min par IP) ───
    const forwarded = request.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';

    if (rateLimit(`landing-chat:${clientIp}`, { windowMs: 60_000, maxRequests: 10 })) {
      return NextResponse.json(
        { success: false, error: 'Too many messages. Please wait.' },
        { status: 429 }
      );
    }

    // ─── 2. Kill switch ───
    const locale: Language = validation.data.locale || 'fr';

    if (!GROQ_AI_ENABLED) {
      return NextResponse.json({
        success: true,
        fallback: true,
        answer: FALLBACK_RESPONSES[locale],
        latencyMs: Date.now() - startTime,
      } satisfies ChatResponse);
    }

    // ─── 3. Detect tracking request BEFORE calling Groq ───
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qrtagss.com';
    const trackingResult = detectTrackingRequest(sanitizedQuestion, locale);

    if (trackingResult?.type === 'link') {
      const trackingLink = `${appUrl}/suivi/${trackingResult.reference}`;
      const answer = locale === 'fr'
        ? `Voici votre lien de suivi : ${trackingLink} (cliquez pour ouvrir)`
        : locale === 'en'
        ? `Here is your tracking link: ${trackingLink} (click to open)`
        : `رابط التتبع الخاص بك: ${trackingLink} (انقر للفتح)`;

      console.log(`[Landing/Chat] Tracking link generated for ${trackingResult.reference} (${Date.now() - startTime}ms)`);

      logMetric('groq', 'landing_tracking_link', Date.now() - startTime, true, {
        key: trackingResult.reference,
        details: `locale=${locale}`,
      });

      return NextResponse.json({
        success: true,
        trackingLink: answer,
        latencyMs: Date.now() - startTime,
      } satisfies ChatResponse);
    }

    if (trackingResult?.type === 'ask_reference') {
      const answer = locale === 'fr'
        ? 'Quelle est la référence de votre QR code ? (ex: VOL26-XXXXXX)'
        : locale === 'en'
        ? 'What is your QR code reference? (e.g. VOL26-XXXXXX)'
        : 'ما هو مرجع رمز QR الخاص بك؟ (مثال: VOL26-XXXXXX)';

      return NextResponse.json({
        success: true,
        askReference: true,
        answer,
        latencyMs: Date.now() - startTime,
      } satisfies ChatResponse);
    }

    // ─── 4. Build messages with KB-enriched system prompt ───
    const systemPrompt = buildSystemPrompt(locale);

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
        .slice(-6)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: sanitizeQuestion(m.content as string).substring(0, 500),
        }));
      if (validHistory.length > 0) {
        messages.splice(1, 0, ...validHistory);
      }
    }

    // ─── 5. Call Groq with timeout 3s ───
    const timeoutFallback: GroqResult = {
      success: false,
      error: 'Landing chatbot timeout (3s)',
      fallback: true,
      latencyMs: CHATBOT_TIMEOUT_MS,
    };

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

    // ─── 6. Process result ───
    if (result.success && result.content) {
      const cleaned = result.content
        .replace(/^["'`]+|["'`]+$/g, '')
        .trim();

      console.log(`[Groq/LandingChat] ✓ Response in ${latencyMs}ms (${cleaned.length} chars, locale=${locale})`);

      logMetric('groq', 'landing_chat_response', latencyMs, true, {
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
    logMetric('groq', 'landing_chat_response', latencyMs, false, {
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
    console.error(`[Groq/LandingChat] ✗ Error:`, error);

    logMetric('groq', 'landing_chat_response', latencyMs, false, {
      details: error instanceof Error ? error.message : 'unknown',
    });

    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
