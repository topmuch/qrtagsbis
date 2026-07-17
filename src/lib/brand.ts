/**
 * QRTags — Brand color tokens (shared across pages)
 *
 * Visual reference: emerald green (#10B981) + amber (#F59E0B),
 * black text on amber, white text on green. High-contrast, modern,
 * mobile-first. African/money/trust feel.
 */

export const BRAND = '#10B981';   // Émeraude QRTags — fonds principaux, headers, boutons primaires
export const ACCENT = '#F59E0B';  // Ambre QRTags — cards, blocs de contenu, badges
export const INK = '#1a1a1a';     // Noir — texte sur ambre, bordures dashed

export const BRAND_COLORS = {
  BRAND,
  ACCENT,
  INK,
  EMERALD: BRAND,
  AMBER: ACCENT,
  BLACK: INK,
} as const;
