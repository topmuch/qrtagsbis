/**
 * WhatsApp Pre-Filled Message Generator — Page Suivi
 *
 * WHATSAPP-HARMONIZED: Template harmonisé unique multi-transport
 *
 * Génère un message WhatsApp pré-rempli structuré pour TOUS les modes
 * de transport (flight/train/boat/bus) × TOUS les contextes (departure/arrival/transit/static).
 *
 * Ce message est envoyé par le PROPRIÉTAIRE au TROUVEUR.
 * (Inverse de generateWhatsAppMessage() dans groq.ts qui est
 *  l'alerte automatique au propriétaire).
 *
 * Template harmonisé :
 *   [EMOJI_CONTEXT + TITRE_CONTEXT]
 *   🧳 [REFERENCE] • [BAG_TYPE]
 *   [TRANSPORT_ICON] [CARRIER] [VEHICLE] • [DESTINATION]
 *   👉 Voir le bagage localisé : qrtags.com/suivi/[REF]
 *   👤 [FINDER_NAME]
 *   📱 [FINDER_WHATSAPP]
 *   [CALL_TO_ACTION_CONTEXT]
 *   QRTags – Protégez vos bagages, en toute sérénité.
 *
 * Contraintes:
 *   - Max 400 caractères (limite wa.me pre-filled)
 *   - Formatage WhatsApp (*gras*, `monospace`)
 *   - Lien court qrtags.com/suivi/[REF]
 *   - i18n FR/EN/AR
 *   - Fallbacks robustes (pas de crash si champ manquant)
 *   - Logging discret
 */

import type { Language } from './i18n';
import type { ScanContext } from './scan-context';
import type { TransportMode } from './transport';
import { TRANSPORT_ICONS, TRANSPORT_PLACES } from './transport';

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

// WHATSAPP-HARMONIZED: Interface structurée (nouveau format)
interface PreFilledMessageParams {
  baggage: {
    reference: string;
    bagType: string;
    transportMode: 'flight' | 'train' | 'boat' | 'bus';
    airlineName?: string;
    flightNumber?: string;
    trainCompany?: string;
    trainNumber?: string;
    shipName?: string;
    shipCabin?: string;
    busCompany?: string;
    busLineNumber?: string;
    destination?: string;
  };
  scanData: {
    city: string;
    address: string;
    context: ScanContext | string;
  };
  finder: {
    name: string;
    whatsapp: string;
  };
  locale?: 'fr' | 'en' | 'ar';
  ownerName?: string;
}

// ═══════════════════════════════════════════════════════
//  I18N INTERNAL TRANSLATIONS
// ═══════════════════════════════════════════════════════
// WHATSAPP-HARMONIZED: Traductions intégrées (pas de dépendance au hook useTranslation)
// Fallback chain : locale demandée → fr → en

type WhatsAppLocale = 'fr' | 'en' | 'ar';

const TITLES: Record<string, Record<WhatsAppLocale, string>> = {
  departure_urgent: {
    fr: 'URGENT — Bagage à {place} !',
    en: 'URGENT — Baggage at {place} !',
    ar: 'عاجل — أمتعة في {place} !',
  },
  arrival: {
    fr: 'Bagage localisé à destination',
    en: 'Baggage located at destination',
    ar: 'تم تحديد موقع الأمتعة في الوجهة',
  },
  in_transit: {
    fr: 'Bagage dans un transport',
    en: 'Baggage in transit',
    ar: 'أمتعة في طريق',
  },
  static: {
    fr: 'Bagage trouvé en lieu sûr',
    en: 'Baggage found in safe location',
    ar: 'تم العثور على الأمتعة في مكان آمن',
  },
};

const CTAS: Record<string, Record<WhatsAppLocale, string>> = {
  departure_urgent: {
    fr: '⏰ Votre {transport} n\'est pas parti : Appelez MAINTENANT !',
    en: '⏰ Your {transport} hasn\'t departed: Call NOW!',
    ar: '⏰ {transport} لم تغادر بعد: اتصل الآن!',
  },
  arrival: {
    fr: '👉 Contactez-le vite pour organiser la récupération !',
    en: '👉 Contact quickly to arrange pickup!',
    ar: '👉 اتصل به بسرعة لترتيب الاستلام!',
  },
  in_transit: {
    fr: '👉 Convenez d\'un point de rencontre rapidement !',
    en: '👉 Arrange a meeting point quickly!',
    ar: '👉 حدد نقطة لقاء بسرعة!',
  },
  static: {
    fr: '👉 Le bagage est en sécurité, organisez la récupération.',
    en: '👉 The bag is safe, arrange pickup.',
    ar: '👉 الأمتعة في أمان، رتب الاستلام.',
  },
};

const BAG_TYPE_LABELS: Record<string, Record<WhatsAppLocale, string>> = {
  cabine: { fr: 'Cabine', en: 'Cabin', ar: 'مقصورة' },
  soute:  { fr: 'Soute', en: 'Hold', ar: 'شحن' },
  pont:   { fr: 'Pont', en: 'Deck', ar: 'سطح' },
};

const CONTEXT_EMOJIS: Record<string, string> = {
  departure_urgent: '🚨',
  arrival: '✅',
  in_transit: '🚕',
  static: '📍',
};

const SIGNATURES: Record<WhatsAppLocale, string> = {
  fr: 'QRTags – Protégez vos bagages, en toute sérénité.',
  en: 'QRTags – Protect your luggage with peace of mind.',
  ar: 'QRTags – احمِ أمتعتك براحة بال.',
};

const SEE_BAGAGE: Record<WhatsAppLocale, string> = {
  fr: '👉 Voir le bagage localisé :',
  en: '👉 See located bag:',
  ar: '👉 رؤية الأمتعة المحددة:',
};

const TRUNCATED_MARKER: Record<WhatsAppLocale, string> = {
  fr: '…',
  en: '…',
  ar: '…',
};

// ═══════════════════════════════════════════════════════
//  RESOLVER HELPERS
// ═══════════════════════════════════════════════════════

/** Résout le mode de transport avec fallback 'flight' */
function resolveTransportMode(mode?: string): TransportMode {
  if (mode === 'train' || mode === 'boat' || mode === 'bus') return mode;
  return 'flight';
}

/**
 * Normalise le contexte venant de scan-context.ts vers les 4 clés internes.
 * Accepte les formats existants ET les formats simplifiés.
 */
function resolveContext(ctx: string): string {
  if (ctx === 'departure_airport_urgent') return 'departure_urgent';
  if (ctx === 'arrival_airport') return 'arrival';
  if (ctx === 'in_transit') return 'in_transit';
  if (ctx === 'static_location') return 'static';
  // Fallback: unknown → static
  return 'static';
}

/** Résout la locale avec fallback chain : demandée → fr → en */
function resolveLocale(loc?: string): WhatsAppLocale {
  if (loc === 'fr' || loc === 'en' || loc === 'ar') return loc;
  return 'fr';
}

/**
 * Extrait CARRIER (compagnie) et VEHICLE (numéro) selon le mode.
 * Retourne { carrier, vehicle } — l'un ou les deux peuvent être ''.
 */
function getCarrierAndVehicle(baggage: PreFilledMessageParams['baggage'], mode: TransportMode): { carrier: string; vehicle: string } {
  switch (mode) {
    case 'flight':
      return {
        carrier: (baggage.airlineName || '').trim(),
        vehicle: (baggage.flightNumber || '').trim(),
      };
    case 'train':
      return {
        carrier: (baggage.trainCompany || '').trim(),
        vehicle: (baggage.trainNumber || '').trim(),
      };
    case 'boat':
      return {
        carrier: (baggage.shipName || '').trim(),
        vehicle: (baggage.shipCabin || '').trim(),
      };
    case 'bus':
      return {
        carrier: (baggage.busCompany || '').trim(),
        vehicle: (baggage.busLineNumber || '').trim(),
      };
  }
}

/**
 * Résout le label du type de bagage.
 * Pour bateau : si shipCabin existe → l'utiliser (ex: "Pont 4").
 * Sinon : traduire baggageType (cabine/soute).
 */
function resolveBagTypeLabel(baggage: PreFilledMessageParams['baggage'], mode: TransportMode, locale: WhatsAppLocale): string {
  // Bateau : le "type" est généralement le pont/cabine
  if (mode === 'boat' && baggage.shipCabin && baggage.shipCabin.trim()) {
    return baggage.shipCabin.trim();
  }
  // Pour tous les modes : traduire baggageType DB
  const dbType = (baggage.bagType || '').trim().toLowerCase();
  const label = BAG_TYPE_LABELS[dbType]?.[locale];
  if (label) return label;
  // Fallback : afficher la valeur brute (peut être "cabine", "Pont 4", etc.)
  return baggage.bagType || '—';
}

/**
 * Sanitize une chaîne pour insertion dans un message WhatsApp.
 * Conserve UNIQUEMENT : lettres (\p{L}), chiffres (\p{N}), espaces, tirets, underscores, @, +, ().
 * Supprime tout caractère exotique, ponctuation dangereuse, ou contrôle.
 */
function sanitize(input: string): string {
  if (!input) return '';
  return input.replace(/[^\p{L}\p{N}\s\-_.@+()]/gu, '').trim();
}

// ═══════════════════════════════════════════════════════
//  SMART TRUNCATION
// ═══════════════════════════════════════════════════════

/**
 * Tronque intelligemment le message si > 400 chars.
 * Priorité de suppression : finder phone → finder name → CTA → signature.
 * Garde toujours : titre, REF, transport line, lien suivi.
 * Ajoute "…" si tronqué.
 */
function smartTruncate(message: string, maxChars: number, locale: WhatsAppLocale): string {
  if (message.length <= maxChars) return message;

  const lines = message.split('\n');

  // Identifier les lignes par préfixe (fragile mais suffisant pour ce template contrôlé)
  // Priorité de suppression (du moins au plus important) :
  // 8. signature
  // 7. CTA context
  // 6. finder phone
  // 5. finder name

  let truncated = false;

  // Retirer signature (dernière ligne si commence par "QRTags")
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].startsWith('QRTags') || lines[i].startsWith('*QRTags')) {
      lines.splice(i, 1);
      truncated = true;
      break;
    }
  }
  let joined = lines.join('\n');
  if (joined.length <= maxChars) return joined + TRUNCATED_MARKER[locale];

  // Retirer CTA (ligne qui commence par ⏰ ou 👉 et N'EST PAS "Voir le bagage")
  for (let i = lines.length - 1; i >= 0; i--) {
    if ((lines[i].startsWith('⏰') || (lines[i].startsWith('👉') && !lines[i].includes('qrtags.com')))) {
      lines.splice(i, 1);
      truncated = true;
      break;
    }
  }
  joined = lines.join('\n');
  if (joined.length <= maxChars) return joined + TRUNCATED_MARKER[locale];

  // Retirer finder phone (📱)
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].startsWith('📱')) {
      lines.splice(i, 1);
      truncated = true;
      break;
    }
  }
  joined = lines.join('\n');
  if (joined.length <= maxChars) return joined + TRUNCATED_MARKER[locale];

  // Retirer finder name (👤)
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].startsWith('👤')) {
      lines.splice(i, 1);
      truncated = true;
      break;
    }
  }
  joined = lines.join('\n');
  if (joined.length <= maxChars) return joined + TRUNCATED_MARKER[locale];

  // Dernier recours : troncation brute
  return joined.substring(0, maxChars - 1).trim() + '…';
}

// ═══════════════════════════════════════════════════════
//  MAIN FUNCTION
// ═══════════════════════════════════════════════════════

/**
 * Génère un message WhatsApp pré-rempli harmonisé pour le propriétaire contactant le trouveur.
 *
 * WHATSAPP-HARMONIZED: Template structuré unique, multi-transport, multi-contexte, i18n.
 *
 * @param params - Données structurées (baggage, scanData, finder, locale, ownerName)
 * @returns string — Message formaté ≤ 400 caractères, prêt pour wa.me
 *
 * @example
 * ```ts
 * // TEST: Message flight+departure_urgent → <400 chars, emoji 🚨, CTA urgent
 * const msg = generatePreFilledMessage({
 *   baggage: { reference: 'VOL26-VABJZS', bagType: 'soute', transportMode: 'flight',
 *     airlineName: 'Air France', flightNumber: 'AF1234', destination: 'Paris' },
 *   scanData: { city: 'Dakar', address: '', context: 'departure_airport_urgent' },
 *   finder: { name: 'Ouslane Diop', whatsapp: '+221784858226' },
 *   locale: 'fr',
 * });
 * // msg.startsWith("🚨 URGENT") && msg.length <= 400
 * ```
 */
export function generatePreFilledMessage(params: PreFilledMessageParams): string {
  const { baggage, scanData, finder, locale: rawLocale, ownerName } = params;

  // ─── Step 1: Resolve all inputs ───
  const mode: TransportMode = resolveTransportMode(baggage.transportMode);
  const context: string = resolveContext(scanData.context);
  const locale: WhatsAppLocale = resolveLocale(rawLocale);

  // ─── Step 2: Extract transport data ───
  const transportIcon: string = TRANSPORT_ICONS[mode];
  const { carrier, vehicle } = getCarrierAndVehicle(baggage, mode);
  const bagTypeLabel: string = resolveBagTypeLabel(baggage, mode, locale);

  // ─── Step 3: Build title line ───
  const contextEmoji: string = CONTEXT_EMOJIS[context] || CONTEXT_EMOJIS.static;
  const titleTemplate: string = TITLES[context]?.[locale] || TITLES.static.fr;

  // Pour departure_urgent, injecter le lieu de départ selon le mode
  let title: string;
  if (context === 'departure_urgent') {
    const place = TRANSPORT_PLACES[mode]?.[locale]?.departure || TRANSPORT_PLACES.flight.fr.departure;
    title = titleTemplate.replace('{place}', place);
  } else {
    title = titleTemplate;
  }

  // ─── Step 4: Build transport line ───
  let transportLine = '';
  if (carrier || vehicle) {
    const parts: string[] = [transportIcon];
    if (carrier) parts.push(carrier);
    if (vehicle) parts.push(vehicle);
    if (baggage.destination) parts.push(`• ${sanitize(baggage.destination)}`);
    transportLine = parts.join(' ');
  }

  // ─── Step 5: Assemble all lines ───
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
    : 'https://qrtags.com';
  const sanitizedRef = sanitize(baggage.reference);

  const lines: string[] = [];

  // Line 1: Context title — *gras* WhatsApp (TOUJOURS)
  // NOTE: Pas de sanitize() ici — le titre est construit depuis des templates de confiance
  lines.push(`${contextEmoji} *${title}*`);

  // Line 2: Reference en `monospace` + bag type (TOUJOURS)
  // NOTE: sanitize sur ref (input utilisateur) mais pas sur bagTypeLabel (template de confiance)
  lines.push(`🧳 \`${sanitizedRef}\` • ${bagTypeLabel}`);

  // Line 3: Transport info (si CARRIER ou VEHICLE présent)
  if (transportLine) {
    lines.push(transportLine);
  }

  // Line 4: Tracking link (TOUJOURS)
  lines.push(`${SEE_BAGAGE[locale]} ${appUrl}/suivi/${sanitizedRef}`);

  // Line 5: Finder name (optionnel)
  const finderName = sanitize(finder.name);
  if (finderName) {
    lines.push(`👤 ${finderName}`);
  }

  // Line 6: Finder WhatsApp (optionnel)
  const finderWhatsapp = sanitize(finder.whatsapp);
  if (finderWhatsapp) {
    lines.push(`📱 ${finderWhatsapp}`);
  }

  // Line 7: CTA context (TOUJOURS dans le template)
  // Pour departure_urgent, résoudre {transport} avec le label du mode
  const TRANSPORT_LABELS_CTA: Record<TransportMode, Record<WhatsAppLocale, string>> = {
    flight: { fr: 'vol', en: 'flight', ar: 'رحلة' },
    train:  { fr: 'train', en: 'train', ar: 'قطار' },
    boat:   { fr: 'traversée', en: 'crossing', ar: 'عبور' },
    bus:    { fr: 'bus', en: 'bus', ar: 'حافلة' },
  };
  let cta: string = CTAS[context]?.[locale] || CTAS.static.fr;
  if (context === 'departure_urgent') {
    const tLabel = TRANSPORT_LABELS_CTA[mode]?.[locale] || TRANSPORT_LABELS_CTA.flight.fr;
    cta = cta.replace('{transport}', tLabel);
  }
  lines.push(cta);

  // Line 8: Signature (TOUJOURS dans le template)
  lines.push(SIGNATURES[locale]);

  // ─── Step 6: Join and truncate ───
  let message = lines.join('\n');

  // Troncation intelligente si > 400 chars
  message = smartTruncate(message, 400, locale);

  // ─── Step 7: Logging discret ───
  // TEST: Logging format [WhatsApp/PreFilled] flight/departure_urgent/fr → 378 chars
  console.log(`[WhatsApp/PreFilled] ${mode}/${context}/${locale} → ${message.length} chars`);

  return message;
}

/**
 * Résout le label du type de bagage.
 * Exporté pour réutilisation dans les pages (évite la duplication).
 *
 * @param baggageType - Valeur DB ("cabine", "soute", ou personnalisé)
 * @param transportMode - Mode de transport
 * @param shipCabin - Pour bateau : le pont/cabine
 * @param locale - Langue (fr/en/ar)
 * @returns string - Label lisible
 *
 * @example
 * ```ts
 * resolveBagTypeLabelExported('cabine', 'flight', undefined, 'fr') → "Cabine"
 * resolveBagTypeLabelExported('soute', 'boat', 'Pont 4', 'fr') → "Pont 4"
 * ```
 */
export function resolveBagTypeLabelExported(
  baggageType: string,
  transportMode: string,
  shipCabin?: string | null,
  locale: WhatsAppLocale = 'fr'
): string {
  const mode = resolveTransportMode(transportMode);
  // Bateau : le "type" est généralement le pont/cabine
  if (mode === 'boat' && shipCabin && shipCabin.trim()) {
    return shipCabin.trim();
  }
  const dbType = (baggageType || '').trim().toLowerCase();
  const label = BAG_TYPE_LABELS[dbType]?.[locale];
  if (label) return label;
  return baggageType || '—';
}

/**
 * Génère l'URL WhatsApp complète pour contacter le trouveur.
 * Préservé sans modification — utilisé par /suivi et potentiellement d'autres pages.
 *
 * @param finderPhone - Numéro du trouveur (format international, chiffres uniquement)
 * @param message - Message pré-rempli (texte brut)
 * @returns string - URL WhatsApp complète (wa.me/...)
 *
 * @example
 * ```ts
 * const url = buildWhatsAppUrl('33612345678', 'Bonjour ! Mon bagage...');
 * // url = "https://wa.me/33612345678?text=Bonjour%20!%20Mon%20bagage..."
 * ```
 */
export function buildWhatsAppUrl(finderPhone: string, message: string): string {
  const cleanPhone = finderPhone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
