/**
 * Client utilitaire Groq — AI Inference API
 *
 * Ce module contient:
 * - callGroqAI() : appel bas niveau au modèle Groq
 * - generateWhatsAppMessage() : génère un message WhatsApp multilingue via IA
 *
 * Priorité des clés API: DB (Setting table) > process.env
 */

import type { GroqRequest, GroqResult } from '@/types/ai';
import type { ScanSuspicionAnalysis } from '@/types/ai';
import {
  API_RETRY_COUNT,
  FALLBACK_MESSAGES,
  GROQ_AI_ENABLED,
  getServiceConfig,
} from './config';
import type { GroqServiceConfig } from './config';
import { fetchWithRetry } from './fetch-util';

// ═══════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════

/** Timeout max pour la génération de message WhatsApp (3s) */
const WHATSAPP_MSG_TIMEOUT_MS = 3000;

// ─── AI-FEATURE: Timeout pour l'analyse anti-doublon (Feature #2) ───
const SCAN_GUARD_TIMEOUT_MS = 2000;

// ═══════════════════════════════════════════════════════
//  FONCTION PRINCIPALE
// ═══════════════════════════════════════════════════════

/**
 * Appelle le modèle Groq pour de l'inférence IA.
 * Lit la configuration depuis la DB (priorité) puis les env vars.
 *
 * @param request - La requête Groq (model, messages, temperature, max_tokens)
 * @returns GroqResult — jamais lance d'exception
 */
export async function callGroqAI(request: GroqRequest): Promise<GroqResult> {
  const startTime = Date.now();

  // ─── Kill switch master: GROQ_AI_ENABLED (env var) ───
  if (!GROQ_AI_ENABLED) {
    console.log('[Groq] IA désactivée via GROQ_AI_ENABLED=false (env var) → fallback.');
    return {
      success: false,
      error: 'IA désactivée par kill switch (GROQ_AI_ENABLED).',
      fallback: true,
      latencyMs: Date.now() - startTime,
    };
  }

  // ─── Charger la config (DB + env) ───
  let config: GroqServiceConfig;
  try {
    config = await getServiceConfig('groq');
  } catch (error) {
    console.warn('[Groq] Erreur lecture config → fallback:', error);
    return {
      success: false,
      error: FALLBACK_MESSAGES.groq.noApiKey,
      fallback: true,
      latencyMs: Date.now() - startTime,
    };
  }

  // ─── Guard: API key non configurée → fallback ───
  if (!config.apiKey) {
    console.warn('[Groq] Clé API non configurée (DB + env) → fallback.');
    return {
      success: false,
      error: FALLBACK_MESSAGES.groq.noApiKey,
      fallback: true,
      latencyMs: Date.now() - startTime,
    };
  }

  // ─── Validation ───
  if (!request.messages || request.messages.length === 0) {
    console.warn('[Groq] Messages vides.');
    return {
      success: false,
      error: FALLBACK_MESSAGES.groq.invalidRequest,
      fallback: false,
      latencyMs: Date.now() - startTime,
    };
  }

  const model = request.model || config.modelChat;

  // ─── Appel API ───
  console.log(
    `[Groq] Appel modèle "${model}" — ${request.messages.length} message(s), temp=${request.temperature ?? 0.3}`
  );

  const body: Record<string, unknown> = {
    model,
    messages: request.messages,
    temperature: request.temperature ?? 0.3,
    max_tokens: request.max_tokens ?? 1024,
  };

  const result = await fetchWithRetry(
    config.baseUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    },
    config.timeoutMs,
    API_RETRY_COUNT,
    'Groq'
  );

  const latencyMs = Date.now() - startTime;

  if (result.ok) {
    const data = result.data as Record<string, unknown>;
    const choices = data?.choices as Array<Record<string, unknown>> | undefined;
    const usage = data?.usage as Record<string, number> | undefined;
    const message = choices?.[0]?.message as Record<string, unknown> | undefined;
    const content = message?.content as string | undefined;

    if (content) {
      console.log(`[Groq] ✓ Réponse obtenue en ${latencyMs}ms — ${content.length} caractères`);
      return {
        success: true,
        content,
        usage: usage
          ? {
              promptTokens: usage.prompt_tokens ?? 0,
              completionTokens: usage.completion_tokens ?? 0,
              totalTokens: usage.total_tokens ?? 0,
            }
          : undefined,
        latencyMs,
        fallback: false,
      };
    }

    // Réponse OK mais pas de contenu
    console.warn('[Groq] Réponse OK mais contenu vide.');
    return {
      success: false,
      error: 'Réponse vide du modèle.',
      fallback: true,
      latencyMs,
    };
  }

  // ─── Échec → fallback (ne bloque jamais le flux) ───
  console.warn(`[Groq] ✗ Échec après ${API_RETRY_COUNT + 1} tentatives (${latencyMs}ms) → fallback.`);
  return {
    success: false,
    error: FALLBACK_MESSAGES.groq.genericError,
    fallback: true,
    latencyMs,
  };
}

// ═══════════════════════════════════════════════════════
//  WHATSAPP MESSAGE GENERATOR
// ═══════════════════════════════════════════════════════

/** Paramètres pour la génération du message WhatsApp */
export interface WhatsAppMessageParams {
  /** Référence du bagage (ex: "VOL26-ZG46J2") */
  reference: string;
  /** Localisation du scan */
  location: { city: string; country: string };
  /** Heure du scan (ex: "18h45") */
  time: string;
  /** URL de suivi */
  link: string;
  /** Langue du message */
  language: 'fr' | 'en' | 'ar';
  /** Mode de transport (flight/train/boat/bus) — différencie le message */
  transportMode?: 'flight' | 'train' | 'boat' | 'bus';
}

/** Résultat de la génération */
export interface WhatsAppMessageResult {
  /** Message généré (ou fallback) */
  message: string;
  /** true si le message vient de Groq, false si fallback */
  generated: boolean;
  /** Temps de réponse en ms */
  latencyMs: number;
}

// TRANSPORT-NOTIFY: Transport-specific emoji + label mapping
const TRANSPORT_NOTIFY_INFO: Record<string, { emoji: string; fr: string; en: string; ar: string }> = {
  flight: { emoji: '✈️', fr: 'vol', en: 'flight', ar: 'رحلة طيران' },
  train:  { emoji: '🚆', fr: 'train', en: 'train', ar: 'قطار' },
  boat:   { emoji: '🚢', fr: 'traversée maritime', en: 'boat crossing', ar: 'رحلة بحرية' },
  bus:    { emoji: '🚌', fr: 'voyage en bus', en: 'bus trip', ar: 'رحلة حافلة' },
};

/** Messages fallback statiques par langue × mode de transport */
const FALLBACK_WHATSAPP_MESSAGES: Record<string, (p: WhatsAppMessageParams) => string> = {
  // ─── Avion ───
  fr: (p) => {
    const t = TRANSPORT_NOTIFY_INFO[p.transportMode || 'flight'];
    return `${t.emoji} Alerte QRTags\nVotre bagage ${p.reference} (${t.fr}) a été scanné à ${p.location.city}, ${p.location.country} à ${p.time}.\nSuivez son statut : ${p.link}`;
  },
  en: (p) => {
    const t = TRANSPORT_NOTIFY_INFO[p.transportMode || 'flight'];
    return `${t.emoji} QRTags Alert\nYour bag ${p.reference} (${t.en}) was scanned in ${p.location.city}, ${p.location.country} at ${p.time}.\nTrack it: ${p.link}`;
  },
  ar: (p) => {
    const t = TRANSPORT_NOTIFY_INFO[p.transportMode || 'flight'];
    return `${t.emoji} تنبيه QRTags\nتم مسح أمتعتك ${p.reference} (${t.ar}) في ${p.location.city}، ${p.location.country} الساعة ${p.time}.\nتابع حالتها: ${p.link}`;
  },
};

// TRANSPORT-NOTIFY: Prompts système par langue — adaptés pour modes de transport
const SYSTEM_PROMPTS: Record<string, string> = {
  fr: `Tu es un assistant QRTags. Génère UN SEUL message WhatsApp d'alerte de scan de bagage.
RÈGLES STRICTES:
- Maximum 280 caractères STRICT
- Ton urgent mais rassurant
- Utilise des emojis pertinents AU MODE DE TRANSPORT (✈️ avion, 🚆 train, 🚢 bateau, 🚌 bus)
- Adapte le vocabulaire : "vol" / "train" / "traversée maritime" / "voyage en bus"
- Formate comme un message WhatsApp (sauts de ligne avec \\n)
- Commence par l'emoji du mode de transport + "Alerte QRTags"
- Inclus: référence, mode de transport, lieu, heure, lien de suivi
- RETOURNE UNIQUEMENT LE MESSAGE, aucun commentaire ni explication`,

  en: `You are a QRTags assistant. Generate a SINGLE WhatsApp baggage scan alert message.
STRICT RULES:
- Maximum 280 characters STRICT
- Urgent but reassuring tone
- Use transport-mode-specific emojis (✈️ flight, 🚆 train, 🚢 boat, 🚌 bus)
- Adapt vocabulary: "flight" / "train" / "boat crossing" / "bus trip"
- Format as a WhatsApp message (newlines with \\n)
- Start with transport emoji + "QRTags Alert"
- Include: reference, transport mode, location, time, tracking link
- RETURN ONLY THE MESSAGE, no comments or explanation`,

  ar: `أنت مساعد QRTags. قم بتوليد رسالة تنبيه مسح أمتعة واحدة عبر واتساب.
قواعد صارمة:
- بحد أقصى 280 حرفًا كحد أقصى
- نبرة عاجلة ولكن مطمئنة
- استخدم رموز تعبيرية مناسبة لوسيلة النقل (✈️ طائرة، 🚆 قطار، 🚢 سفينة، 🚌 حافلة)
- تكيف المفردات: "رحلة طيران" / "قطار" / "رحلة بحرية" / "رحلة حافلة"
- صيغة كرسالة واتساب (أسطر جديدة مع \\n)
- ابدأ برمز وسيلة النقل + "تنبيه QRTags"
- ضمّن: المرجع، وسيلة النقل، الموقع، الوقت، رابط التتبع
- أعد الرسالة فقط، بدون تعليقات أو شرح`,
};

/**
 * Génère un message WhatsApp d'alerte de scan via Groq AI.
 * Si Groq échoue ou dépasse le timeout de 3s, retourne un message statique par défaut.
 *
 * @param params - Données du scan (référence, localisation, heure, lien, langue)
 * @returns WhatsAppMessageResult — contient le message + métadonnées
 *
 * @example
 * ```ts
 * const result = await generateWhatsAppMessage({
 *   reference: 'VOL26-ZG46J2',
 *   location: { city: 'Dakar', country: 'Sénégal' },
 *   time: '18h45',
 *   link: 'https://qrtagss.com/suivi/VOL26-ZG46J2',
 *   language: 'fr',
 * });
 * console.log(result.message); // "🚨 Alerte QRTags..."
 * console.log(result.generated); // true si IA, false si fallback
 * ```
 */
export async function generateWhatsAppMessage(
  params: WhatsAppMessageParams
): Promise<WhatsAppMessageResult> {
  const startTime = Date.now();

  // ─── Guard rapide : fallback immédiat si params invalides ───
  if (!params.reference || !params.location?.city || !params.link) {
    const fb = FALLBACK_WHATSAPP_MESSAGES[params.language] ?? FALLBACK_WHATSAPP_MESSAGES.fr;
    return {
      message: fb(params),
      generated: false,
      latencyMs: Date.now() - startTime,
    };
  }

  // ─── Appel Groq avec timeout 3s ───
  try {
    const result = await Promise.race([
      callGroqAI({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPTS[params.language] },
          {
            role: 'user',
            content: [
              `Référence: ${params.reference}`,
              `Mode de transport: ${TRANSPORT_NOTIFY_INFO[params.transportMode || 'flight']?.fr || 'vol'}`,
              `Ville: ${params.location.city}`,
              `Pays: ${params.location.country}`,
              `Heure: ${params.time}`,
              `Lien: ${params.link}`,
            ].join('\n'),
          },
        ],
        temperature: 0.4,
        max_tokens: 100,
      }),
      // Timeout 3s — ne bloque jamais le flux de scan
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), WHATSAPP_MSG_TIMEOUT_MS)
      ),
    ]);

    const latencyMs = Date.now() - startTime;

    if (result.success && result.content) {
      // Nettoyer : supprimer les guillemets et les backticks éventuels
      const cleaned = result.content
        .replace(/^["'`]+|["'`]+$/g, '')
        .trim();

      // Valider la longueur
      if (cleaned.length > 0 && cleaned.length <= 350) {
        console.log(`[Groq/WhatsApp] ✓ Message généré en ${latencyMs}ms (${cleaned.length} chars, lang=${params.language})`);
        return { message: cleaned, generated: true, latencyMs };
      }

      // Trop long → fallback silencieux
      console.warn(`[Groq/WhatsApp] Message trop long (${cleaned.length} chars) → fallback`);
    }

    // Échec Groq → fallback statique
    return {
      message: FALLBACK_WHATSAPP_MESSAGES[params.language]?.(params) ?? FALLBACK_WHATSAPP_MESSAGES.fr(params),
      generated: false,
      latencyMs,
    };
  } catch (error) {
    const latencyMs = Date.now() - startTime;

    // Logging discret — pas de stack trace
    if (error instanceof Error && error.message === 'TIMEOUT') {
      console.warn(`[Groq/WhatsApp] Timeout ${WHATSAPP_MSG_TIMEOUT_MS}ms → fallback`);
    } else {
      console.warn(`[Groq/WhatsApp] Erreur → fallback`);
    }

    return {
      message: FALLBACK_WHATSAPP_MESSAGES[params.language]?.(params) ?? FALLBACK_WHATSAPP_MESSAGES.fr(params),
      generated: false,
      latencyMs,
    };
  }
}

// ═══════════════════════════════════════════════════════
//  AI-FEATURE: SCAN GUARD — Analyse Anti-Doublon (Feature #2)
// ═══════════════════════════════════════════════════════

/** Paramètres pour l'analyse anti-doublon */
export interface ScanSuspicionParams {
  /** Référence du bagage */
  reference: string;
  /** IP du scanner */
  scannerIp: string;
  /** User-Agent du scanner */
  userAgent?: string;
  /** Ville du scan */
  city?: string;
  /** Pays du scan */
  country?: string;
  /** Historique récent des scans du même bagage (dernières 30 min) */
  recentScans: Array<{
    ip: string;
    city?: string;
    country?: string;
    createdAt: string;
  }>;
}

/** Résultat de l'analyse anti-doublon */
export interface ScanSuspicionResult {
  /** Analyse complétée avec succès */
  analyzed: boolean;
  /** Analyse de suspicion (si analyzed=true) */
  analysis?: ScanSuspicionAnalysis;
  /** Temps de réponse en ms */
  latencyMs: number;
}

/** Prompt système pour l'analyse anti-doublon */
const SCAN_GUARD_SYSTEM_PROMPT = `Tu es un détecteur de fraude QRTags. Analyse ces données de scan et retourne UNIQUEMENT un JSON valide sans backticks ni commentaires.
{
  "isSuspicious": boolean,
  "reason": string (courte, max 100 caractères),
  "confidence": number (0.0 à 1.0)
}
Règles strictes :
- Même IP + même bagage + < 5 min entre 2 scans = probablement un doublon (isSuspicious: true, confidence >= 0.85)
- Localisation incohérente (ex: pays africain puis europe en < 30 min) = suspect
- User-Agent contenant "bot", "crawler", "spider", "scraper" = suspect
- 1 seul scan récent avec IP différente = normal (isSuspicious: false)
- En cas de doute = isSuspicious: false (fail-open)`;

/**
 * AI-FEATURE: Analyse un scan pour détecter les doublons/suspicious via Groq.
 * Timeout 2s — fail-open si Groq indisponible ou timeout.
 * Ne bloque JAMAIS le flux de scan.
 *
 * @param params - Données du scan + historique récent
 * @returns ScanSuspicionResult — analyzed=false si échec (fail-open)
 *
 * @example
 * ```ts
 * const result = await analyzeScanSuspicion(params);
 * if (result.analysis?.isSuspicious) return;
 * ```
 */
export async function analyzeScanSuspicion(
  params: ScanSuspicionParams
): Promise<ScanSuspicionResult> {
  const startTime = Date.now();

  try {
    const recentScansText = params.recentScans.length > 0
      ? params.recentScans.map((s, i) =>
          `Scan ${i + 1}: IP=${s.ip}, Ville=${s.city || '?'}, Pays=${s.country || '?'}, Date=${s.createdAt}`
        ).join('\n')
      : 'Aucun scan récent.';

    const scanContext = [
      `Référence bagage: ${params.reference}`,
      `IP actuelle: ${params.scannerIp}`,
      `User-Agent: ${params.userAgent || 'inconnu'}`,
      `Ville: ${params.city || 'inconnue'}`,
      `Pays: ${params.country || 'inconnu'}`,
      `Dernier scan: ${new Date().toISOString()}`,
      `--- Historique récent (30 min) ---`,
      recentScansText,
    ].join('\n');

    const result = await Promise.race([
      callGroqAI({
        model: 'llama-3.1-8b-instant', // Modèle rapide pour analyse courte
        messages: [
          { role: 'system', content: SCAN_GUARD_SYSTEM_PROMPT },
          { role: 'user', content: scanContext },
        ],
        temperature: 0.1, // Très déterministe pour l'analyse
        max_tokens: 150,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), SCAN_GUARD_TIMEOUT_MS)
      ),
    ]);

    const latencyMs = Date.now() - startTime;

    if (result.success && result.content) {
      // Extraire le JSON de la réponse
      const cleaned = result.content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Parse with specific error handling for malformed JSON
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        console.warn(`[Groq/ScanGuard] ${params.reference} → JSON invalide → fail-open (${latencyMs}ms)`);
        return { analyzed: false, latencyMs };
      }

      if (
        typeof parsed.isSuspicious === 'boolean' &&
        typeof parsed.confidence === 'number'
      ) {
        const analysis: ScanSuspicionAnalysis = {
          isSuspicious: parsed.isSuspicious,
          reason: String(parsed.reason || '').substring(0, 100),
          confidence: Math.min(Math.max(parsed.confidence, 0), 1),
          analyzedAt: new Date().toISOString(),
        };

        console.log(
          `[Groq/ScanGuard] ${params.reference} → ${analysis.isSuspicious ? 'FLAGGED' : 'OK'} (confidence=${analysis.confidence}, ${latencyMs}ms)`
        );

        return { analyzed: true, analysis, latencyMs };
      }
    }

    // Réponse invalide → fail-open
    console.warn(`[Groq/ScanGuard] ${params.reference} → réponse invalide → fail-open (${latencyMs}ms)`);
    return { analyzed: false, latencyMs };

  } catch (error) {
    const latencyMs = Date.now() - startTime;

    if (error instanceof Error && error.message === 'TIMEOUT') {
      console.warn(`[Groq/ScanGuard] ${params.reference} → TIMEOUT ${SCAN_GUARD_TIMEOUT_MS}ms → fail-open`);
    } else {
      console.warn(`[Groq/ScanGuard] ${params.reference} → erreur → fail-open`);
    }

    // Fail-open: ne bloque jamais le scan
    return { analyzed: false, latencyMs };
  }
}
