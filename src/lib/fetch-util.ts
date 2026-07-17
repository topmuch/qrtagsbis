/**
 * Utilitaires HTTP partagés — fetch avec timeout et retry.
 *
 * Utilisé par:
 * - src/lib/wakit.ts
 * - src/lib/groq.ts
 *
 * Ne propage jamais d'erreur — retourne toujours un résultat structuré.
 */

import { API_RETRY_DELAY_MS } from './config';

// ═══════════════════════════════════════════════════════
//  SLEEP
// ═══════════════════════════════════════════════════════

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════
//  FETCH AVEC TIMEOUT & RETRY
// ═══════════════════════════════════════════════════════

export interface FetchResult {
  ok: boolean;
  data: unknown;
  status?: number;
}

/**
 * Effectue un fetch avec timeout et retry.
 *
 * @param url - URL cible
 * @param options - Options fetch standard
 * @param timeoutMs - Timeout en ms (AbortController)
 * @param retries - Nombre de retry supplémentaires (0 = pas de retry)
 * @param serviceName - Nom du service pour les logs (ex: "Wakit", "Groq")
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  timeoutMs: number,
  retries: number,
  serviceName: string
): Promise<FetchResult> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.warn(
          `[${serviceName}] Retry ${attempt}/${retries} après ${API_RETRY_DELAY_MS}ms...`
        );
        await sleep(API_RETRY_DELAY_MS);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.warn(
          `[${serviceName}] HTTP ${response.status} — ${text.substring(0, 200)}`
        );
        lastError = new Error(`HTTP ${response.status}`);
        continue; // retry
      }

      const data = await response.json();
      return { ok: true, data, status: response.status };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur inconnue';
      console.warn(
        `[${serviceName}] Tentative ${attempt + 1} échouée: ${message}`
      );
      lastError = err instanceof Error ? err : new Error(message);
    }
  }

  return { ok: false, data: null, status: lastError ? 500 : undefined };
}
