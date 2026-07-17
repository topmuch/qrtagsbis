/**
 * Configuration centralisée pour les services externes Wakit & Groq.
 *
 * Ce module contient:
 * - Des constantes synchrones lues depuis process.env (fallback)
 * - Une fonction async getServiceConfig() qui lit depuis la DB (priorité)
 *
 * Priorité des clés API: DB (Setting table) > process.env
 */

// ═══════════════════════════════════════════════════════
//  WAKIT CONFIG
// ═══════════════════════════════════════════════════════

export const WAKIT_BASE_URL =
  process.env.WAKIT_BASE_URL || 'https://api.wakit.ai/v1';

export const WAKIT_API_KEY = process.env.WAKIT_API_KEY || '';

export const WAKIT_PHONE_NUMBER_ID =
  process.env.WAKIT_PHONE_NUMBER_ID || '';

export const WAKIT_TEMPLATE_SCAN_ALERT =
  process.env.WAKIT_TEMPLATE_SCAN_ALERT || 'tag_scan_alert';

export const WAKIT_TIMEOUT_MS =
  parseInt(process.env.WAKIT_TIMEOUT_MS || '10000', 10);

export const WAKIT_ENABLED = WAKIT_API_KEY.length > 0;

// ═══════════════════════════════════════════════════════
//  GROQ CONFIG
// ═══════════════════════════════════════════════════════

export const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

export const GROQ_MODEL_CHAT =
  process.env.GROQ_MODEL_CHAT || 'llama-3.3-70b-versatile';

export const GROQ_MODEL_ANALYSIS =
  process.env.GROQ_MODEL_ANALYSIS || 'llama-3.1-8b-instant';

export const GROQ_TIMEOUT_MS =
  parseInt(process.env.GROQ_TIMEOUT_MS || '30000', 10);

export const GROQ_ENABLED = GROQ_API_KEY.length > 0;

/**
 * Master kill switch pour toutes les fonctionnalités IA Groq.
 * Par défaut activé ('true'). Passer à 'false' dans .env pour désactiver
 * complètement l'IA, quelle que soit la valeur du flag DB.
 * Priorité: env var (kill switch) > DB feature flag > API key présente.
 */
export const GROQ_AI_ENABLED = process.env.GROQ_AI_ENABLED !== 'false';

// ═══════════════════════════════════════════════════════
//  AI-FEATURE: Kill switches individuels par fonctionnalité
// ═══════════════════════════════════════════════════════

/**
 * Active/désactive le chatbot trouveur (Feature #1).
 * Priorité: env var > DB FeatureFlag 'chatbot_finder'.
 */
export const GROQ_CHAT_ENABLED = process.env.GROQ_CHAT_ENABLED !== 'false';

/**
 * Active/désactive l'analyse anti-doublon (Feature #2).
 * Priorité: env var > DB FeatureFlag 'scan_guard'.
 */
export const GROQ_SCAN_GUARD_ENABLED = process.env.GROQ_SCAN_GUARD_ENABLED !== 'false';

/**
 * Active/désactive la traduction automatique IA (Feature #3).
 * Priorité: env var > DB FeatureFlag 'auto_translate'.
 */
export const GROQ_AUTO_TRANSLATE_ENABLED = process.env.GROQ_AUTO_TRANSLATE_ENABLED !== 'false';

// ═══════════════════════════════════════════════════════
//  TIMEOUTS & FALLBACK
// ═══════════════════════════════════════════════════════

/** Timeout par défaut pour les appels API (ms) */
export const API_TIMEOUT_MS = 10000;

/** Nombre de tentatives de retry pour les appels API */
export const API_RETRY_COUNT = 1;

/** Délai entre les retries (ms) */
export const API_RETRY_DELAY_MS = 1000;

// ═══════════════════════════════════════════════════════
//  FALLBACK MESSAGES
// ═══════════════════════════════════════════════════════

export const FALLBACK_MESSAGES = {
  wakit: {
    unavailable: 'Service WhatsApp indisponible — le message n\'a pas été envoyé.',
    noApiKey: 'Clé API Wakit non configurée — fallback vers wa.me.',
    invalidPhone: 'Numéro de téléphone invalide.',
    genericError: 'Erreur lors de l\'envoi WhatsApp.',
  },
  groq: {
    unavailable: 'Service IA indisponible — réponse par défaut utilisée.',
    noApiKey: 'Clé API Groq non configurée — fallback logique classique.',
    invalidRequest: 'Requête IA invalide.',
    genericError: 'Erreur lors de l\'appel au modèle IA.',
  },
} as const;

// ═══════════════════════════════════════════════════════
//  HELPERS (SYNC — env vars only)
// ═══════════════════════════════════════════════════════

/**
 * Vérifie si un service externe est activé et prêt (env vars uniquement).
 * Pour la vérification complète (DB + env), utiliser isServiceEnabledAsync().
 */
export function isEnabled(service: 'wakit' | 'groq'): boolean {
  if (service === 'wakit') return WAKIT_ENABLED;
  if (service === 'groq') return GROQ_ENABLED;
  return false;
}

/**
 * Retourne un résumé de l'état de tous les services externes (env vars uniquement).
 */
export function getServicesStatus(): Record<string, { enabled: boolean; label: string }> {
  return {
    wakit: {
      enabled: WAKIT_ENABLED,
      label: 'WhatsApp Business (Wakit)',
    },
    groq: {
      enabled: GROQ_ENABLED,
      label: 'IA Inference (Groq)',
    },
  };
}

// ═══════════════════════════════════════════════════════
//  DB KEYS — Mapping entre Setting DB keys et service config
// ═══════════════════════════════════════════════════════

/** Clés dans la table Setting pour chaque service */
export const DB_KEYS = {
  wakit: {
    apiKey: 'wakit_api_key',
    baseUrl: 'wakit_base_url',
    phoneNumberId: 'wakit_phone_number_id',
    templateScanAlert: 'wakit_template_scan_alert',
    timeoutMs: 'wakit_timeout_ms',
  },
  groq: {
    apiKey: 'groq_api_key',
    baseUrl: 'groq_base_url',
    modelChat: 'groq_model_chat',
    modelAnalysis: 'groq_model_analysis',
    timeoutMs: 'groq_timeout_ms',
  },
} as const;

// ═══════════════════════════════════════════════════════
//  ASYNC CONFIG — Lecture DB + env fallback
// ═══════════════════════════════════════════════════════

/** Configuration complète d'un service (lue depuis DB ou env) */
export interface ServiceConfig {
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
}

/** Configuration complète du service Wakit */
export interface WakitServiceConfig extends ServiceConfig {
  phoneNumberId: string;
  templateScanAlert: string;
  timeoutMs: number;
}

/** Configuration complète du service Groq */
export interface GroqServiceConfig extends ServiceConfig {
  modelChat: string;
  modelAnalysis: string;
  timeoutMs: number;
}

/**
 * Récupère la configuration complète d'un service.
 * Priorité: DB (table Setting) > process.env > valeurs par défaut.
 * Résultat mis en cache 60 secondes côté settings.ts.
 *
 * @param service - 'wakit' ou 'groq'
 */
export async function getServiceConfig(service: 'wakit'): Promise<WakitServiceConfig>;
export async function getServiceConfig(service: 'groq'): Promise<GroqServiceConfig>;
export async function getServiceConfig(service: 'wakit' | 'groq'): Promise<WakitServiceConfig | GroqServiceConfig> {
  // Import dynamique pour éviter les dépendances circulaires
  const { getApiKey } = await import('./settings');

  if (service === 'wakit') {
    const [apiKey, baseUrl, phoneNumberId, templateScanAlert, timeoutStr] = await Promise.all([
      getApiKey(DB_KEYS.wakit.apiKey, 'WAKIT_API_KEY', WAKIT_API_KEY),
      getApiKey(DB_KEYS.wakit.baseUrl, 'WAKIT_BASE_URL', WAKIT_BASE_URL),
      getApiKey(DB_KEYS.wakit.phoneNumberId, 'WAKIT_PHONE_NUMBER_ID', WAKIT_PHONE_NUMBER_ID),
      getApiKey(DB_KEYS.wakit.templateScanAlert, 'WAKIT_TEMPLATE_SCAN_ALERT', WAKIT_TEMPLATE_SCAN_ALERT),
      getApiKey(DB_KEYS.wakit.timeoutMs, 'WAKIT_TIMEOUT_MS', String(WAKIT_TIMEOUT_MS)),
    ]);

    return {
      apiKey,
      baseUrl,
      phoneNumberId,
      templateScanAlert,
      timeoutMs: parseInt(timeoutStr, 10) || 10000,
      enabled: apiKey.length > 0,
    };
  }

  // groq
  const [apiKey, baseUrl, modelChat, modelAnalysis, timeoutStr] = await Promise.all([
    getApiKey(DB_KEYS.groq.apiKey, 'GROQ_API_KEY', GROQ_API_KEY),
    getApiKey(DB_KEYS.groq.baseUrl, 'GROQ_BASE_URL', GROQ_BASE_URL),
    getApiKey(DB_KEYS.groq.modelChat, 'GROQ_MODEL_CHAT', GROQ_MODEL_CHAT),
    getApiKey(DB_KEYS.groq.modelAnalysis, 'GROQ_MODEL_ANALYSIS', GROQ_MODEL_ANALYSIS),
    getApiKey(DB_KEYS.groq.timeoutMs, 'GROQ_TIMEOUT_MS', String(GROQ_TIMEOUT_MS)),
  ]);

  return {
    apiKey,
    baseUrl: baseUrl.includes('/chat/completions')
      ? baseUrl
      : `${baseUrl.replace(/\/+$/, '')}/chat/completions`,
    modelChat: modelChat.includes('=') ? modelChat.split('=').pop()?.trim() || modelChat : modelChat,
    modelAnalysis: modelAnalysis.includes('=') ? modelAnalysis.split('=').pop()?.trim() || modelAnalysis : modelAnalysis,
    timeoutMs: Math.max(parseInt(timeoutStr, 10) || 30000, 5000),
    enabled: apiKey.length > 0,
  };
}

/**
 * Vérifie de manière asynchrone si un service est activé.
 * Check DB en premier, puis env vars.
 */
export async function isServiceEnabledAsync(service: 'wakit' | 'groq'): Promise<boolean> {
  if (service === 'wakit') {
    const config = await getServiceConfig('wakit');
    return config.enabled;
  }
  const config = await getServiceConfig('groq');
  return config.enabled;
}

/**
 * Retourne le statut complet des services (DB + env).
 */
export async function getServicesStatusAsync(): Promise<Record<string, { enabled: boolean; label: string; source: string }>> {
  const [wakitConfig, groqConfig] = await Promise.all([
    getServiceConfig('wakit'),
    getServiceConfig('groq'),
  ]);

  return {
    wakit: {
      enabled: wakitConfig.enabled,
      label: 'WhatsApp Business (Wakit)',
      source: wakitConfig.apiKey && wakitConfig.apiKey === WAKIT_API_KEY && WAKIT_API_KEY ? 'env' : 'db',
    },
    groq: {
      enabled: groqConfig.enabled,
      label: 'IA Inference (Groq)',
      source: groqConfig.apiKey && groqConfig.apiKey === GROQ_API_KEY && GROQ_API_KEY ? 'env' : 'db',
    },
  };
}
