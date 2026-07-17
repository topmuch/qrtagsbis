/**
 * Status Normalization — Central helper
 *
 * La DB peut contenir des statuts en français (CRÉÉ, ACTIVÉ)
 * ou en anglais (created, activated).
 *
 * Ce module fournit une normalisation centralisée utilisée partout.
 *
 * Format standard (english) : created | activated | scanned | lost | found | blocked | expired
 */

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

/** All possible standard statuses for tags */
export type TagStatus =
  | 'created'
  | 'activated'
  | 'scanned'
  | 'lost'
  | 'found'
  | 'blocked'
  | 'expired';

/** @deprecated Use TagStatus instead */
export type BaggageStatus = TagStatus;

// ═══════════════════════════════════════════════════════
//  ALIASES
// ═══════════════════════════════════════════════════════

const STATUS_ALIASES: Record<string, TagStatus> = {
  // New QRTags statuses
  created: 'created',
  activated: 'activated',
  scanned: 'scanned',
  lost: 'lost',
  found: 'found',
  blocked: 'blocked',
  expired: 'expired',

  // French → English
  CRÉÉ: 'created',
  ACTIVÉ: 'activated',
  SCANNÉ: 'scanned',
  PERDU: 'lost',
  TROUVÉ: 'found',
  BLOQUÉ: 'blocked',
  EXPIRÉ: 'expired',

  // Lowercase French
  créé: 'created',
  activé: 'activated',
  scanné: 'scanned',
  perdu: 'lost',
  trouvé: 'found',
  bloqué: 'blocked',
  expiré: 'expired',

  // Legacy QRTags statuses → QRTags mapping
  pending_activation: 'created',
  active: 'activated',
  EN_ATTENTE: 'created',
  ACTIF: 'activated',
  en_attente: 'created',
  actif: 'activated',
};

// ═══════════════════════════════════════════════════════
//  NORMALIZE
// ═══════════════════════════════════════════════════════

/**
 * Normalize any status string to standard English format.
 * Returns 'created' as safe default for null/undefined.
 */
export function normalizeTagStatus(status: string | null | undefined): TagStatus {
  if (!status) return 'created';
  return STATUS_ALIASES[status] || (status as TagStatus);
}

/**
 * @deprecated Use normalizeTagStatus instead
 */
export function normalizeStatus(status: string | null | undefined): TagStatus {
  return normalizeTagStatus(status);
}

/**
 * @deprecated Use normalizeTagStatus instead
 */
export function normalizeBaggageStatus(status: string | null | undefined): TagStatus {
  return normalizeTagStatus(status);
}

/**
 * Check if status is "created" (any variant).
 */
export function isCreated(status: string | null | undefined): boolean {
  return normalizeTagStatus(status) === 'created';
}

/**
 * Check if status is "pending" (any variant) — legacy alias for isCreated.
 */
export function isPending(status: string | null | undefined): boolean {
  return normalizeTagStatus(status) === 'created';
}

/**
 * Check if status is "activated" (any variant).
 */
export function isActivated(status: string | null | undefined): boolean {
  const s = normalizeTagStatus(status);
  return s === 'activated' || s === 'scanned';
}

/**
 * Check if status is "active" (any variant) — legacy alias for isActivated.
 */
export function isActive(status: string | null | undefined): boolean {
  return isActivated(status);
}

/**
 * Check if status is "scanned" (any variant).
 */
export function isScanned(status: string | null | undefined): boolean {
  return normalizeTagStatus(status) === 'scanned';
}

/**
 * Check if status is "lost" (any variant).
 */
export function isLost(status: string | null | undefined): boolean {
  return normalizeTagStatus(status) === 'lost';
}

/**
 * Check if status is "found" (any variant).
 */
export function isFound(status: string | null | undefined): boolean {
  return normalizeTagStatus(status) === 'found';
}

/**
 * Build a Prisma `{ in: [...] }` filter for a given standard status
 * that matches BOTH French and English variants in DB.
 */
export function statusFilterIn(standardStatus: TagStatus): { in: string[] } {
  const aliases = Object.entries(STATUS_ALIASES)
    .filter(([, eng]) => eng === standardStatus)
    .map(([fr]) => fr);
  return { in: [standardStatus, ...aliases] };
}

/**
 * Build a Prisma `{ in: [...] }` filter for multiple standard statuses.
 */
export function statusFilterInMany(standardStatuses: TagStatus[]): { in: string[] } {
  const all: string[] = [];
  for (const s of standardStatuses) {
    const f = statusFilterIn(s);
    all.push(...f.in);
  }
  return { in: [...new Set(all)] };
}
