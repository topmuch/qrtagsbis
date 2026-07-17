/**
 * Client utilitaire Wakit — WhatsApp Business API
 *
 * Prêt à recevoir les appels:
 * - Si la clé API n'est pas configurée (DB + env) → retourne { fallback: true }
 * - Si l'API est configurée → envoie la requête avec timeout + retry (1 tentative)
 * - En cas d'échec → log console.warn et retourne { fallback: true }
 *
 * Les clés API sont lues depuis la DB (table Setting) en priorité,
 * puis depuis process.env en fallback.
 *
 * Usage:
 *   const result = await sendWakitMessage({ to: "33612345678", template: "baggage_scan_alert", variables: { name: "Ali" } });
 *   if (result.fallback) { // ouvrir wa.me à la place }
 */

import type { WakitPayload, WakitResult } from '@/types/ai';
import {
  API_RETRY_COUNT,
  FALLBACK_MESSAGES,
  getServiceConfig,
} from './config';
import type { WakitServiceConfig } from './config';
import { fetchWithRetry } from './fetch-util';

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Valide un numéro de téléphone.
 * Accepte les formats: +33612345678, 33612345678, 0612345678
 */
function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-().]/g, '');
  const pattern = /^\+?\d{7,15}$/;
  return pattern.test(cleaned);
}

/**
 * Normalise un numéro de téléphone pour l'API Wakit.
 * Retire les espaces, tirets, parenthèses. Garde le + si présent.
 */
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-().]/g, '');
}

// ═══════════════════════════════════════════════════════
//  FONCTION PRINCIPALE
// ═══════════════════════════════════════════════════════

/**
 * Envoie un message WhatsApp via l'API Wakit.
 * Lit la configuration depuis la DB (priorité) puis les env vars.
 *
 * @returns WakitResult — jamais lance d'exception
 */
export async function sendWakitMessage(payload: WakitPayload): Promise<WakitResult> {
  const startTime = Date.now();

  // ─── Charger la config (DB + env) ───
  let config: WakitServiceConfig;
  try {
    config = await getServiceConfig('wakit');
  } catch (error) {
    console.warn('[Wakit] Erreur lecture config → fallback:', error);
    return {
      success: false,
      status: 'fallback',
      error: FALLBACK_MESSAGES.wakit.noApiKey,
      fallback: true,
      latencyMs: Date.now() - startTime,
    };
  }

  // ─── Guard: API key non configurée → fallback ───
  if (!config.apiKey) {
    console.warn('[Wakit] Clé API non configurée (DB + env) → fallback.');
    return {
      success: false,
      status: 'fallback',
      error: FALLBACK_MESSAGES.wakit.noApiKey,
      fallback: true,
      latencyMs: Date.now() - startTime,
    };
  }

  // ─── Validation du numéro ───
  if (!payload.to || !isValidPhone(payload.to)) {
    console.warn(`[Wakit] Numéro invalide: "${payload.to}"`);
    return {
      success: false,
      status: 'failed',
      error: FALLBACK_MESSAGES.wakit.invalidPhone,
      fallback: false,
      latencyMs: Date.now() - startTime,
    };
  }

  // ─── Validation du template ───
  if (!payload.template) {
    console.warn('[Wakit] Nom de template manquant.');
    return {
      success: false,
      status: 'failed',
      error: 'Template name is required.',
      fallback: false,
      latencyMs: Date.now() - startTime,
    };
  }

  const phone = normalizePhone(payload.to);

  // ─── Appel API ───
  console.log(`[Wakit] Envoi à ${phone.substring(0, 4)}*** via template "${payload.template}"`);

  const url = `${config.baseUrl}/messages`;
  const body = {
    to: phone,
    template: payload.template,
    variables: payload.variables || {},
  };

  const result = await fetchWithRetry(
    url,
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
    'Wakit'
  );

  const latencyMs = Date.now() - startTime;

  if (result.ok) {
    const data = result.data as Record<string, unknown>;
    console.log(`[Wakit] ✓ Message envoyé en ${latencyMs}ms — ID: ${data?.id ?? 'N/A'}`);
    return {
      success: true,
      messageId: (data?.id as string) || undefined,
      status: 'sent',
      latencyMs,
      fallback: false,
    };
  }

  // ─── Échec → fallback (ne bloque jamais le flux) ───
  console.warn(`[Wakit] ✗ Échec après ${API_RETRY_COUNT + 1} tentatives (${latencyMs}ms) → fallback.`);
  return {
    success: false,
    status: 'fallback',
    error: FALLBACK_MESSAGES.wakit.genericError,
    fallback: true,
    latencyMs,
  };
}
