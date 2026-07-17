'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import { Language, LANGUAGE_NAMES } from '@/lib/i18n';

type Variant = 'mustard' | 'blue';

interface Props {
  lang: Language;
  setLang: (l: Language) => void;
  /** 'mustard' = yellow #c5a643 + ink #1a1a1a (legacy /scan, /suivi).
   *  'blue' = blue-600 #2563eb + slate-900 (homepage /checklist theme).
   *  Defaults to 'mustard' for backward compatibility. */
  variant?: Variant;
}

const THEMES: Record<Variant, {
  border: string;
  text: string;
  hoverBg: string;
  activeBg: string;
  activeText: string;
  hoverActiveBg: string;
}> = {
  mustard: {
    border: 'border-[#1a1a1a]',
    text: 'text-[#1a1a1a]',
    hoverBg: 'hover:bg-[#c5a643]',
    activeBg: 'bg-[#c5a643]',
    activeText: 'text-[#1a1a1a]',
    hoverActiveBg: 'hover:bg-[#c5a643]/30',
  },
  blue: {
    border: 'border-slate-300',
    text: 'text-slate-700',
    hoverBg: 'hover:bg-blue-600 hover:text-white hover:border-blue-600',
    activeBg: 'bg-blue-600',
    activeText: 'text-white',
    hoverActiveBg: 'hover:bg-blue-50',
  },
};

/**
 * Shared LanguageSelector dropdown.
 * Used by public pages: /scan, /suivi, /checklist, /checklist/[code].
 *
 * variant='mustard' (default): yellow #c5a643 + ink #1a1a1a — for /scan, /suivi.
 * variant='blue': blue-600 + slate — matches the homepage theme, for /checklist.
 */
export function LanguageSelector({ lang, setLang, variant = 'mustard' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = THEMES[variant];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-white border-2 ${theme.border} rounded-full ${theme.text} ${theme.hoverBg} transition-colors text-xs sm:text-sm md:text-base font-medium shadow-sm min-h-[36px] sm:min-h-[40px] md:min-h-[44px]`}
      >
        <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
        <span>{LANGUAGE_NAMES[lang]}</span>
      </button>

      {isOpen && (
        <div role="listbox" aria-label="Language" className={`absolute top-full right-0 mt-1 sm:mt-2 bg-white border-2 ${theme.border} rounded-xl shadow-lg overflow-hidden z-50 min-w-[140px] sm:min-w-[160px]`}>
          {(['fr', 'en', 'ar'] as Language[]).map((l) => (
            <button
              key={l}
              role="option"
              aria-selected={lang === l}
              onClick={() => {
                setLang(l);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 sm:px-5 sm:py-3 text-left text-xs sm:text-sm md:text-base font-medium transition-colors ${
                lang === l
                  ? `${theme.activeBg} ${theme.activeText}`
                  : `${theme.text} ${theme.hoverActiveBg}`
              }`}
            >
              {LANGUAGE_NAMES[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
