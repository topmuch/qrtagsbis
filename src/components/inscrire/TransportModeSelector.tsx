/**
 * TRANSPORT-FEATURE: Transport Mode Selector Component
 *
 * Sélecteur visuel de mode de transport : 4 boutons en grid 2×2.
 * Chaque bouton affiche la VRAIE IMAGE du moyen de transport (PNG)
 * + label i18n + description.
 *
 * Style (palette QRTags — bleu #0047d6 + jaune #fcd616):
 *   - Non sélectionné: carte jaune #fcd616 + bordure noire dashed + image (mix-blend multiply).
 *   - Sélectionné: carte jaune #fcd616 + bordure noire solide + image (mix-blend multiply)
 *     + checkmark jaune QRTags en haut à droite.
 *
 * Usage:
 *   <TransportModeSelector
 *     selectedMode={transportMode}
 *     onSelect={setTransportMode}
 *     t={t}
 *     lang={lang}
 *   />
 */

'use client';

import Image from 'next/image';
import type { TransportMode } from '@/lib/transport';
import {
  TRANSPORT_MODES,
  TRANSPORT_IMAGES,
  TRANSPORT_LABELS,
  TRANSPORT_DESCRIPTIONS,
} from '@/lib/transport';
import type { Language } from '@/lib/i18n';

interface TransportModeSelectorProps {
  /** Mode actuellement sélectionné */
  selectedMode: TransportMode | '';
  /** Callback quand un mode est sélectionné */
  onSelect: (mode: TransportMode) => void;
  /** Fonction de traduction */
  t: (key: string) => string;
  /** Langue courante */
  lang: Language;
}

export default function TransportModeSelector({
  selectedMode,
  onSelect,
  t,
  lang,
}: TransportModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {TRANSPORT_MODES.map((mode) => {
        const isSelected = selectedMode === mode;
        const imgSrc = TRANSPORT_IMAGES[mode];
        const label = TRANSPORT_LABELS[mode][lang] ?? TRANSPORT_LABELS[mode].fr;
        const description = TRANSPORT_DESCRIPTIONS[mode][lang] ?? TRANSPORT_DESCRIPTIONS[mode].fr;

        return (
          <button
            key={mode}
            type="button"
            onClick={() => onSelect(mode)}
            aria-pressed={isSelected}
            aria-label={t(`transport.mode_${mode}`)}
            className={`
              relative flex flex-col items-center justify-center
              rounded-xl p-3 sm:p-4 min-h-[140px] sm:min-h-[160px]
              border-2 transition-all duration-200 overflow-hidden
              focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2
              ${
                isSelected
                  ? 'border-black border-solid bg-[#fcd616] shadow-lg shadow-black/20 scale-[1.02]'
                  : 'border-black border-dashed bg-[#fcd616] hover:bg-[#fcd616]/80'
              }
            `}
          >
            {/* Vraie photo du moyen de transport — full color, gros plan.
                object-cover pour remplir entièrement le cadre (effet visuel fort). */}
            <div className="w-full h-20 sm:h-24 mb-2 flex items-center justify-center overflow-hidden rounded-lg">
              <Image
                src={imgSrc}
                alt={label}
                width={120}
                height={96}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                priority={false}
              />
            </div>

            {/* Label */}
            <span className="text-sm sm:text-base font-bold text-black transition-colors">
              {label}
            </span>

            {/* Description */}
            <span className="text-[10px] sm:text-xs mt-0.5 leading-tight text-center text-black/70">
              {description}
            </span>

            {/* Selected indicator — pastille noire avec checkmark jaune QRTags */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-black rounded-full flex items-center justify-center ring-2 ring-white">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#fcd616" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
