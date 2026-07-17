/**
 * TRANSPORT-FEATURE: Multi-Context Transport Utilities
 *
 * Central definitions for the transport mode system (flight/train/boat/bus).
 * Used by:
 *   - Form /inscrire (mode selector + conditional fields)
 *   - Pages /scan & /suivi (conditional rendering)
 *   - API activate, scan, suivi (validation + response)
 *
 * Types:
 *   - TransportMode: union type 'flight' | 'train' | 'boat' | 'bus'
 *   - TransportFieldDef: shape of a conditional input field
 *
 * Helpers:
 *   - TRANSPORT_ICONS: emoji per mode
 *   - TRANSPORT_LABELS: i18n label per mode × language
 *   - TRANSPORT_FIELDS: field definitions per mode
 *   - TRANSPORT_BLOCK_HEADERS: i18n block header per mode × language
 *   - safeTransportMode(): fallback for legacy/null values
 *   - getTransportLabel(): get localized label
 *   - getTransportIcon(): get emoji icon
 */

import type { Language } from './i18n';

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

/** Modes de transport supportés */
export type TransportMode = 'flight' | 'train' | 'boat' | 'bus';

/** Tous les modes valides (pour validation) */
export const TRANSPORT_MODES: TransportMode[] = ['flight', 'train', 'boat', 'bus'];

/** Définition d'un champ de formulaire conditionnel */
export interface TransportFieldDef {
  /** Clé dans formData / colonne en DB */
  key: string;
  /** Clé i18n pour le label */
  labelKey: string;
  /** Clé i18n pour le placeholder */
  placeholderKey: string;
  /** Si true, champ requis à la soumission */
  required: boolean;
}

// ═══════════════════════════════════════════════════════
//  ICONS (Emojis — fallback) + IMAGES (vraies images)
// ═══════════════════════════════════════════════════════

/** Icône emoji pour chaque mode de transport (fallback si image non disponible) */
export const TRANSPORT_ICONS: Record<TransportMode, string> = {
  flight: '✈️',
  train: '🚆',
  boat: '🚢',
  bus: '🚌',
};

/** Vraies images (PNG) pour chaque mode de transport.
 *  Style: silhouette noire + accent #c5a643 + fond blanc.
 *  Utilisées dans le sélecteur de mode et les en-têtes de page. */
export const TRANSPORT_IMAGES: Record<TransportMode, string> = {
  flight: '/images/transport/flight.png',
  train:  '/images/transport/train.png',
  boat:   '/images/transport/boat.png',
  bus:    '/images/transport/bus.png',
};

// ═══════════════════════════════════════════════════════
//  LABELS i18n
// ═══════════════════════════════════════════════════════

/** Labels courts pour chaque mode × langue (boutons sélecteur) */
export const TRANSPORT_LABELS: Record<TransportMode, Record<Language, string>> = {
  flight: { fr: 'Avion', en: 'Flight', ar: 'طائرة' },
  train:  { fr: 'Train', en: 'Train', ar: 'قطار' },
  boat:   { fr: 'Bateau', en: 'Boat', ar: 'سفينة' },
  bus:    { fr: 'Bus', en: 'Bus', ar: 'حافلة' },
};

/** Descriptions sous chaque bouton de mode × langue */
export const TRANSPORT_DESCRIPTIONS: Record<TransportMode, Record<Language, string>> = {
  flight: { fr: 'Compagnie + vol', en: 'Airline + flight', ar: 'شركة الطيران + الرحلة' },
  train:  { fr: 'Compagnie + train', en: 'Company + train', ar: 'شركة السكك + القطار' },
  boat:   { fr: 'Navire + cabine', en: 'Ship + cabin', ar: 'السفينة + الكابينة' },
  bus:    { fr: 'Compagnie + ligne', en: 'Company + line', ar: 'شركة النقل + الخط' },
};

/** Headers des blocs info dans les pages scan/suivi × langue */
export const TRANSPORT_BLOCK_HEADERS: Record<TransportMode, Record<Language, string>> = {
  flight: { fr: 'DÉTAILS DU VOL', en: 'FLIGHT DETAILS', ar: 'تفاصيل الرحلة' },
  train:  { fr: 'DÉTAILS DU TRAJET', en: 'TRAIN DETAILS', ar: 'تفاصيل الرحلة بالقطار' },
  boat:   { fr: 'DÉTAILS DE LA TRAVERSÉE', en: 'CROSSING DETAILS', ar: 'تفاصيل العبور' },
  bus:    { fr: 'DÉTAILS DU VOYAGE', en: 'TRIP DETAILS', ar: 'تفاصيل الرحلة' },
};

// WHATSAPP-HARMONIZED: Lieux de départ/arrivée par mode × langue (réutilisable pour notifications)
export const TRANSPORT_PLACES: Record<TransportMode, Record<Language, { departure: string; arrival: string }>> = {
  flight: {
    fr: { departure: "l'aéroport de départ", arrival: "l'aéroport d'arrivée" },
    en: { departure: 'the departure airport', arrival: 'the arrival airport' },
    ar: { departure: 'مطار المغادرة', arrival: 'مطار الوصول' },
  },
  train: {
    fr: { departure: 'la gare', arrival: 'la gare d\'arrivée' },
    en: { departure: 'the train station', arrival: 'the arrival station' },
    ar: { departure: 'محطة القطار', arrival: 'محطة الوصول' },
  },
  boat: {
    fr: { departure: 'le port', arrival: 'le port d\'arrivée' },
    en: { departure: 'the port', arrival: 'the arrival port' },
    ar: { departure: 'الميناء', arrival: 'ميناء الوصول' },
  },
  bus: {
    fr: { departure: 'la gare routière', arrival: 'la gare d\'arrivée' },
    en: { departure: 'the bus station', arrival: 'the arrival bus station' },
    ar: { departure: 'محطة الحافلات', arrival: 'محطة الوصول' },
  },
};

// ═══════════════════════════════════════════════════════
//  FIELD DEFINITIONS (Formulaire dynamique)
// ═══════════════════════════════════════════════════════

/** Champs de formulaire conditionnels par mode */
export const TRANSPORT_FIELDS: Record<TransportMode, TransportFieldDef[]> = {
  flight: [
    {
      key: 'airlineName',
      labelKey: 'transport.airline',
      placeholderKey: 'transport.airline_placeholder',
      required: false,
    },
    {
      key: 'flightNumber',
      labelKey: 'transport.flight_number',
      placeholderKey: 'transport.flight_number_placeholder',
      required: false,
    },
  ],
  train: [
    {
      key: 'trainCompany',
      labelKey: 'transport.train_company',
      placeholderKey: 'transport.train_company_placeholder',
      required: false,
    },
    {
      key: 'trainNumber',
      labelKey: 'transport.train_number',
      placeholderKey: 'transport.train_number_placeholder',
      required: false,
    },
  ],
  boat: [
    {
      key: 'shipName',
      labelKey: 'transport.ship_name',
      placeholderKey: 'transport.ship_name_placeholder',
      required: false,
    },
    {
      key: 'shipCabin',
      labelKey: 'transport.ship_cabin',
      placeholderKey: 'transport.ship_cabin_placeholder',
      required: false,
    },
  ],
  bus: [
    {
      key: 'busCompany',
      labelKey: 'transport.bus_company',
      placeholderKey: 'transport.bus_company_placeholder',
      required: false,
    },
    {
      key: 'busLineNumber',
      labelKey: 'transport.bus_line',
      placeholderKey: 'transport.bus_line_placeholder',
      required: false,
    },
  ],
};

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Retourne un TransportMode sûr, avec fallback sur 'flight'.
 *
 * // TEST: Si baggage sans transportMode (null), fallback 'flight'
 * // TEST: Si transportMode='train', retourne 'train'
 * // TEST: Si transportMode='unknown_string', fallback 'flight'
 */
export function safeTransportMode(mode: string | null | undefined): TransportMode {
  if (mode === 'train' || mode === 'boat' || mode === 'bus') return mode;
  return 'flight';
}

/**
 * Retourne le label localisé d'un mode de transport.
 */
export function getTransportLabel(mode: TransportMode, lang: Language): string {
  return TRANSPORT_LABELS[mode]?.[lang] ?? TRANSPORT_LABELS.flight[lang];
}

/**
 * Retourne l'icône emoji d'un mode de transport.
 */
export function getTransportIcon(mode: TransportMode): string {
  return TRANSPORT_ICONS[mode] ?? '✈️';
}

/**
 * Retourne le path de la vraie image d'un mode de transport.
 */
export function getTransportImage(mode: TransportMode): string {
  return TRANSPORT_IMAGES[mode] ?? TRANSPORT_IMAGES.flight;
}

/**
 * Retourne le header de bloc info localisé pour un mode.
 */
export function getTransportBlockHeader(mode: TransportMode, lang: Language): string {
  return TRANSPORT_BLOCK_HEADERS[mode]?.[lang] ?? TRANSPORT_BLOCK_HEADERS.flight[lang];
}

/**
 * Retourne les clés DB des champs contextuels pour un mode donné.
 * Utile pour les SELECT Prisma optimisés.
 */
export function getTransportFieldKeys(mode: TransportMode): string[] {
  return TRANSPORT_FIELDS[mode].map((f) => f.key);
}
