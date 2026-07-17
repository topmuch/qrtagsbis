// Language detection and translation utilities

export type Language = 'fr' | 'en' | 'ar';

export const LANGUAGE_NAMES: Record<Language, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية'
};

export const LANGUAGE_DIRECTION: Record<Language, 'ltr' | 'rtl'> = {
  fr: 'ltr',
  en: 'ltr',
  ar: 'rtl'
};

// Country to language mapping
export const COUNTRY_LANGUAGE_MAP: Record<string, Language> = {
  // French speaking countries
  'FR': 'fr', // France
  'SN': 'fr', // Senegal
  'BE': 'fr', // Belgium (French/Dutch/German - defaulting to French)
  'LU': 'fr', // Luxembourg
  'MC': 'fr', // Monaco
  'MG': 'fr', // Madagascar
  'CI': 'fr', // Ivory Coast
  'ML': 'fr', // Mali
  'BF': 'fr', // Burkina Faso
  'NE': 'fr', // Niger
  'TG': 'fr', // Togo
  'BJ': 'fr', // Benin
  'CF': 'fr', // Central African Republic
  'TD': 'fr', // Chad
  'CG': 'fr', // Congo
  'CD': 'fr', // DR Congo
  'GA': 'fr', // Gabon
  'CM': 'fr', // Cameroon (French/English)
  'RW': 'fr', // Rwanda
  'BI': 'fr', // Burundi
  'DJ': 'fr', // Djibouti
  'KM': 'fr', // Comoros

  // English speaking countries
  'US': 'en', // United States
  'GB': 'en', // United Kingdom
  'IE': 'en', // Ireland
  'CA': 'en', // Canada (English/French - defaulting to English)
  'AU': 'en', // Australia
  'NZ': 'en', // New Zealand
  'ZA': 'en', // South Africa
  'NG': 'en', // Nigeria
  'GH': 'en', // Ghana
  'KE': 'en', // Kenya
  'UG': 'en', // Uganda
  'TZ': 'en', // Tanzania
  'IN': 'en', // India
  'PK': 'en', // Pakistan
  'PH': 'en', // Philippines
  'SG': 'en', // Singapore
  'MY': 'en', // Malaysia
  'HK': 'en', // Hong Kong

  // Arabic speaking countries
  'SA': 'ar', // Saudi Arabia
  'AE': 'ar', // UAE
  'EG': 'ar', // Egypt
  'MA': 'ar', // Morocco
  'DZ': 'ar', // Algeria
  'TN': 'ar', // Tunisia
  'LY': 'ar', // Libya
  'JO': 'ar', // Jordan
  'LB': 'ar', // Lebanon
  'SY': 'ar', // Syria
  'IQ': 'ar', // Iraq
  'KW': 'ar', // Kuwait
  'QA': 'ar', // Qatar
  'BH': 'ar', // Bahrain
  'OM': 'ar', // Oman
  'YE': 'ar', // Yemen
  'PS': 'ar', // Palestine
  'SD': 'ar', // Sudan
  'MR': 'ar', // Mauritania
};

// Browser language code to language mapping
export const BROWSER_LANG_MAP: Record<string, Language> = {
  'fr': 'fr',
  'fr-FR': 'fr',
  'fr-BE': 'fr',
  'fr-CA': 'fr',
  'fr-CH': 'fr',
  'fr-LU': 'fr',
  'en': 'en',
  'en-US': 'en',
  'en-GB': 'en',
  'en-AU': 'en',
  'en-CA': 'en',
  'en-NZ': 'en',
  'en-IE': 'en',
  'en-ZA': 'en',
  'ar': 'ar',
  'ar-SA': 'ar',
  'ar-AE': 'ar',
  'ar-EG': 'ar',
  'ar-MA': 'ar',
  'ar-DZ': 'ar',
  'ar-TN': 'ar',
  'ar-JO': 'ar',
  'ar-LB': 'ar',
  'ar-KW': 'ar',
  'ar-QA': 'ar',
  'ar-BH': 'ar',
  'ar-OM': 'ar',
};

// Detect language from browser
export function detectLanguageFromBrowser(): Language {
  if (typeof window === 'undefined') return 'fr';

  const browserLang = navigator.language || (navigator as Navigator & { userLanguage?: string }).userLanguage;

  if (!browserLang) return 'fr';

  // Check exact match first
  if (BROWSER_LANG_MAP[browserLang]) {
    return BROWSER_LANG_MAP[browserLang];
  }

  // Check prefix match
  const prefix = browserLang.split('-')[0].toLowerCase();
  if (BROWSER_LANG_MAP[prefix]) {
    return BROWSER_LANG_MAP[prefix];
  }

  return 'fr'; // Default to French
}

// Detect language from country code
export function detectLanguageFromCountry(countryCode: string): Language {
  return COUNTRY_LANGUAGE_MAP[countryCode.toUpperCase()] || 'fr';
}

// AI-FEATURE: Cookie name for locale persistence (server-side)
export const LANGUAGE_COOKIE_NAME = 'qrtags_locale';
export const LANGUAGE_COOKIE_MAX_AGE_DAYS = 7;

/**
 * AI-FEATURE: Detect language from HTTP headers (server-side).
 * Used by API routes that don't have access to the client-side useTranslation() hook.
 *
 * Detection order:
 *   1. Cookie 'qrtags_locale' (previously detected)
 *   2. Accept-Language header
 *   3. Fallback: 'fr'
 *
 * @param headers - HTTP Headers object (from NextRequest or Response)
 * @returns Detected language ('fr' | 'en' | 'ar')
 */
export function detectLocaleFromHeaders(headers: Headers): Language {
  // 1. Check cookie first (previously detected language)
  const cookieHeader = headers.get('cookie');
  if (cookieHeader) {
    const localeMatch = cookieHeader.match(/qrtags_locale=(fr|en|ar)/);
    if (localeMatch?.[1]) {
      return localeMatch[1] as Language;
    }
  }

  // 2. Check Accept-Language header
  const acceptLanguage = headers.get('accept-language');
  if (acceptLanguage) {
    const lang = acceptLanguage.split(',')[0]?.split('-')[0]?.trim().toLowerCase();
    if (lang === 'fr' || lang === 'en' || lang === 'ar') {
      return lang;
    }
  }

  // 3. Fallback
  return 'fr';
}

// Translation cache
const translationCache: Record<Language, Record<string, string> | null> = {
  fr: null,
  en: null,
  ar: null
};

// Load translations
export async function loadTranslations(lang: Language): Promise<Record<string, string>> {
  if (translationCache[lang]) {
    return translationCache[lang]!;
  }

  try {
    const response = await fetch(`/locales/${lang}.json`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load ${lang} translations`);
    }
    const translations = await response.json();
    translationCache[lang] = flattenObject(translations);
    return translationCache[lang]!;
  } catch (error) {
    console.error(`Error loading ${lang} translations:`, error);
    // Fallback to French
    if (lang !== 'fr') {
      return loadTranslations('fr');
    }
    return {};
  }
}

// Flatten nested object for easy key access
function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};

  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(result, flattenObject(obj[key] as Record<string, unknown>, newKey));
    } else {
      result[newKey] = String(obj[key]);
    }
  }

  return result;
}

// Get nested value from object using dot notation
export function getNestedValue(obj: Record<string, string>, path: string): string {
  return obj[path] || path;
}
