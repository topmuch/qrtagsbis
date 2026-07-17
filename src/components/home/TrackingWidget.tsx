'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * Regex de validation stricte — alignée sur le format TAG-{TYPE}-{6CHARS}
 * Accepte : TAG-HOTEL-MLQGY7, TAG-BUS-K9X2P4
 * Refuse : tag-hotel-mlqgy7 (mais auto-uppercase le corrige)
 */
const TAG_REGEX = /^TAG-[A-Z]+-[A-Z0-9]{6}$/;

export default function TrackingWidget() {
  const router = useRouter();
  const { t, dir } = useTranslation();

  const [inputValue, setInputValue] = useState<string>('');
  const [error, setError] = useState<string>('');

  const inputId = 'tracking-reference-input';
  const errorId = 'tracking-reference-error';

  const handleSubmit = (): void => {
    const trimmed = inputValue.trim();

    // Empty check
    if (trimmed === '') {
      setError(t('home.tracking_empty'));
      return;
    }

    // Validation regex
    if (!TAG_REGEX.test(trimmed)) {
      setError(t('home.tracking_error'));
      return;
    }

    // Navigate to tracking page
    router.push(`/suivi/${trimmed}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value.toUpperCase());
    // Clear error on typing
    if (error) setError('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <section
      dir={dir}
      className="w-full bg-emerald-600 py-10 sm:py-14"
    >
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-emerald-700 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-xl shadow-emerald-900/20">
          {/* Label */}
          <label
            htmlFor={inputId}
            className="flex items-center gap-2 text-white font-bold text-lg sm:text-xl mb-5"
          >
            <Search className="w-5 h-5 text-emerald-200" />
            {t('home.tracking_label')}
          </label>

          {/* Input + Button */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id={inputId}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={t('home.tracking_placeholder')}
              aria-label={t('home.tracking_label')}
              aria-describedby={error ? errorId : undefined}
              aria-invalid={error !== ''}
              autoComplete="off"
              spellCheck={false}
              maxLength={20}
              className={`
                flex-1 w-full sm:w-auto px-5 py-4 rounded-xl text-base font-mono tracking-wider
                bg-white/10 border text-white placeholder:text-white/40
                transition-all duration-200 outline-none
                focus:ring-2 focus:ring-white/30
                ${error
                  ? 'border-red-300/60 focus:border-red-300'
                  : 'border-white/15 focus:border-white/40'
                }
              `}
            />
            <button
              type="button"
              onClick={handleSubmit}
              className="
                flex items-center justify-center gap-2 px-7 py-4 rounded-xl
                bg-white hover:bg-emerald-50 active:bg-emerald-100
                text-emerald-700 font-bold text-base
                shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/40
                transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                min-h-[52px]
              "
            >
              <Search className="w-4 h-4" />
              <span>{t('home.tracking_button')}</span>
            </button>
          </div>

          {/* Error message */}
          {error !== '' && (
            <p
              id={errorId}
              role="alert"
              aria-live="polite"
              className="text-red-200 text-sm mt-3 flex items-center gap-1.5 font-medium"
            >
              <span className="inline-block w-1.5 h-1.5 bg-red-300 rounded-full flex-shrink-0" />
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
