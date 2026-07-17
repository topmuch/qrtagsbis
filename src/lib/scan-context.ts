/**
 * Scan Context Detection — Analyse le contexte d'un scan de bagage.
 *
 * Détermine automatiquement si le bagage se trouve dans un contexte :
 *   - "departure_airport_urgent" → Aéroport de départ, ≤ 3h avant le vol
 *   - "arrival_airport"          → Aéroport de destination
 *   - "in_transit"               → En mouvement (taxi, véhicule, speed > 5 km/h)
 *   - "static_location"          → Lieu fixe (maison, hôtel, etc.)
 *
 * Le contexte peut être écrasé par une sélection manuelle du trouveur
 * (dropdown dans le formulaire /scan/).
 */

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

/** Contexte de scan possible */
export type ScanContext =
  | 'departure_airport_urgent'
  | 'arrival_airport'
  | 'in_transit'
  | 'static_location';

/** Données du bagage nécessaires à la détection */
export interface BaggageContextData {
  departureDate?: string | Date | null;
  destination?: string | null;
  /** Ville d'origine (si disponible dans les métadonnées) */
  originCity?: string | null;
}

/** Données du scan nécessaires à la détection */
export interface ScanContextData {
  /** Ville du scan */
  city?: string | null;
  /** Adresse textuelle du scan */
  address?: string | null;
  /** Vitesse en km/h (si disponible via le navigateur) */
  speed?: number | null;
  /** Type de point d'intérêt (airport, taxi, hotel, etc.) */
  poiType?: string | null;
}

/** Résultat de la détection de contexte */
export interface ScanContextResult {
  context: ScanContext;
  confidence: number; // 0.0 à 1.0
  reason: string;     // Description courte du raisonnement
}

// ═══════════════════════════════════════════════════════
//  LABELS I18N
// ═══════════════════════════════════════════════════════

/** Labels du contexte par langue */
export const CONTEXT_LABELS: Record<ScanContext, Record<string, string>> = {
  departure_airport_urgent: {
    fr: 'Aéroport de départ — Urgence',
    en: 'Departure Airport — Urgent',
    ar: 'مطار المغادرة — عاجل',
  },
  arrival_airport: {
    fr: 'Aéroport d\'arrivée',
    en: 'Arrival Airport',
    ar: 'مطار الوصول',
  },
  in_transit: {
    fr: 'En transit',
    en: 'In Transit',
    ar: 'في الطريق',
  },
  static_location: {
    fr: 'Lieu fixe',
    en: 'Static Location',
    ar: 'مكان ثابت',
  },
};

/** Icônes emoji pour chaque contexte */
export const CONTEXT_ICONS: Record<ScanContext, string> = {
  departure_airport_urgent: '🛫',
  arrival_airport: '🛬',
  in_transit: '🚕',
  static_location: '📍',
};

/** Couleurs Tailwind pour chaque contexte */
export const CONTEXT_COLORS: Record<ScanContext, string> = {
  departure_airport_urgent: 'bg-red-500',
  arrival_airport: 'bg-green-500',
  in_transit: 'bg-yellow-500',
  static_location: 'bg-blue-500',
};

// ═══════════════════════════════════════════════════════
//  DETECTION LOGIC
// ═══════════════════════════════════════════════════════

/**
 * Détecte automatiquement le contexte d'un scan.
 *
 * @param baggage - Données du bagage (departureDate, destination, originCity)
 * @param scanData - Données du scan (city, address, speed, poiType)
 * @returns ScanContextResult avec le contexte détecté, confiance et raison
 */
export function detectScanContext(
  baggage: BaggageContextData,
  scanData: ScanContextData
): ScanContextResult {
  const now = new Date();

  // ─── Extraction des données ───
  const departure = baggage.departureDate ? new Date(baggage.departureDate) : null;
  const scanCity = (scanData.city || '').toLowerCase();
  const scanAddress = (scanData.address || '').toLowerCase();
  const destination = (baggage.destination || '').toLowerCase();
  const originCity = (baggage.originCity || '').toLowerCase();
  const speed = scanData.speed ?? 0;
  const poiType = (scanData.poiType || '').toLowerCase();

  // ─── Helpers ───
  const isAirport =
    poiType === 'airport' ||
    scanAddress.includes('aéroport') ||
    scanAddress.includes('airport') ||
    scanAddress.includes('مطار') ||
    scanCity.includes('aéroport') ||
    scanCity.includes('airport') ||
    scanCity.includes('مطار');

  const isOrigin = originCity.length > 0 && scanCity.includes(originCity);
  const isDestination = destination.length > 0 && scanCity.includes(destination);
  const isMoving = speed > 5 || poiType === 'taxi' || poiType === 'bus';

  // ─── Heures avant/après le départ ───
  let hoursToDeparture: number | null = null;
  if (departure) {
    hoursToDeparture = (departure.getTime() - now.getTime()) / (1000 * 60 * 60);
  }

  // ─── Règle 1 : Aéroport de départ — Urgence ───
  if (isAirport && isOrigin && hoursToDeparture !== null && hoursToDeparture > -2 && hoursToDeparture < 3) {
    return {
      context: 'departure_airport_urgent',
      confidence: 0.9,
      reason: `Aéroport d'origine, vol dans ${Math.abs(hoursToDeparture).toFixed(1)}h`,
    };
  }

  // ─── Règle 2 : Aéroport d'arrivée ───
  if (isAirport && isDestination) {
    return {
      context: 'arrival_airport',
      confidence: 0.85,
      reason: 'Aéroport de destination détecté',
    };
  }

  // ─── Règle 3 : En transit ───
  if (isMoving) {
    return {
      context: 'in_transit',
      confidence: 0.75,
      reason: poiType === 'taxi' ? 'Taxi détecté' : `Vitesse: ${speed.toFixed(0)} km/h`,
    };
  }

  // ─── Règle 4 : Lieu fixe (défaut) ───
  return {
    context: 'static_location',
    confidence: 0.6,
    reason: 'Aucun mouvement ou aéroport détecté',
  };
}

/**
 * Retourne le contexte par défaut (statique).
 * Utile quand la détection ne peut pas être effectuée.
 */
export function getDefaultContext(): ScanContextResult {
  return {
    context: 'static_location',
    confidence: 0.5,
    reason: 'Contexte non détecté (défaut)',
  };
}
