/**
 * Rate limiter in-memory pour protéger les routes publiques.
 *
 * Usage:
 *   if (rateLimit('notify:VOL26-ABC', { windowMs: 60000, maxRequests: 2 })) {
 *     return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 *   }
 *
 * Nettoyage automatique des entrées expirées toutes les 5 minutes.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  /** Fenêtre de temps en ms (défaut: 60 000 = 1 min) */
  windowMs?: number;
  /** Nombre max de requêtes dans la fenêtre (défaut: 3) */
  maxRequests?: number;
}

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 3;
const CLEANUP_INTERVAL_MS = 300_000; // 5 min

// Store in-memory — réinitialisé au redémarrage du serveur (acceptable pour ce use case)
const store = new Map<string, RateLimitEntry>();

// Nettoyage périodique
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup(): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS);

  // Ne pas bloquer le processus de sortie
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

/**
 * Vérifie si la clé a dépassé le rate limit.
 *
 * @param key - Clé unique (ex: `notify:VOL26-ABC123`)
 * @param options - Fenêtre et max requêtes
 * @returns `true` si la requête doit être rejetée (429), `false` sinon
 */
export function rateLimit(key: string, options?: RateLimitOptions): boolean {
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const maxRequests = options?.maxRequests ?? DEFAULT_MAX_REQUESTS;

  startCleanup();

  const now = Date.now();
  const entry = store.get(key);

  // Pas d'entrée ou fenêtre expirée → premier hit
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  // Dans la fenêtre → incrémenter
  entry.count += 1;

  // Dépassement → reject
  if (entry.count > maxRequests) {
    return true;
  }

  return false;
}
