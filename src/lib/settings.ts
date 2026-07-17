/**
 * Lecture asynchrone des paramètres depuis la table Setting (DB).
 *
 * Ce module fournit un cache en mémoire pour éviter de requêter la DB
 * à chaque appel API. Le cache est rafraîchi toutes les 60 secondes.
 *
 * Utilisé par wakit.ts et groq.ts pour récupérer les clés API
 * configurées par le SuperAdmin dans l'interface Fonctionnalités.
 */

import { db } from './db';

// ═══════════════════════════════════════════════════════
//  CACHE
// ═══════════════════════════════════════════════════════

let settingsCache: Record<string, string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 60 secondes

// ═══════════════════════════════════════════════════════
//  FONCTIONS PUBLIQUES
// ═══════════════════════════════════════════════════════

/**
 * Récupère un paramètre depuis la DB (avec cache).
 * Si la clé n'existe pas en DB, retourne la valeur par défaut.
 *
 * @param key - Clé du paramètre (ex: "wakit_api_key")
 * @param fallback - Valeur par défaut si la clé n'existe pas
 */
export async function getSetting(key: string, fallback: string = ''): Promise<string> {
  const settings = await getAllSettings();
  return settings[key] ?? fallback;
}

/**
 * Récupère tous les paramètres depuis la DB (avec cache).
 * Le cache est invalide après CACHE_TTL_MS.
 */
export async function getAllSettings(): Promise<Record<string, string>> {
  const now = Date.now();

  if (settingsCache && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return settingsCache;
  }

  try {
    const rows = await db.setting.findMany();
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }
    settingsCache = map;
    cacheTimestamp = now;
    return map;
  } catch (error) {
    console.error('[Settings] Erreur lecture DB → retourne le cache existant:', error);
    return settingsCache ?? {};
  }
}

/**
 * Force le rafraîchissement du cache (utile après une sauvegarde).
 */
export function invalidateSettingsCache(): void {
  settingsCache = null;
  cacheTimestamp = 0;
}

/**
 * Vérifie si une clé API est configurée (non vide).
 * Cherche dans la DB d'abord, puis dans process.env.
 */
export async function isApiConfigured(
  dbKey: string,
  envKey: string
): Promise<boolean> {
  // Priorité 1: DB
  const dbValue = await getSetting(dbKey);
  if (dbValue && dbValue.length > 0) return true;

  // Priorité 2: env var
  const envValue = process.env[envKey] || '';
  return envValue.length > 0;
}

/**
 * Récupère la valeur d'une clé API.
 * Priorité: DB > env var > fallback.
 */
export async function getApiKey(
  dbKey: string,
  envKey: string,
  fallback: string = ''
): Promise<string> {
  // Priorité 1: DB
  const dbValue = await getSetting(dbKey);
  if (dbValue && dbValue.length > 0) return dbValue;

  // Priorité 2: env var
  const envValue = process.env[envKey] || '';
  if (envValue.length > 0) return envValue;

  // Priorité 3: fallback
  return fallback;
}
