'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { COUNTRIES, COUNTRY_MAP, type CountryInfo } from '@/lib/phone';

interface PhoneInputProps {
  /** Currently selected country code (ISO 2-letter, e.g. 'FR') */
  countryCode: string;
  /** Callback when the country changes */
  onCountryChange: (code: string) => void;
  /** The phone number value (without dial code) */
  value: string;
  /** Callback when phone number changes — receives the FULL international number (e.g. '+33612345678') */
  onChange: (fullNumber: string) => void;
  /** Placeholder for the local number part */
  placeholder?: string;
  /** Additional CSS classes for the container */
  className?: string;
  /** Whether the input is required */
  required?: boolean;
  /** Dark mode variant (for dark backgrounds like the inscription form) */
  dark?: boolean;
  /** Label text */
  label?: string;
  /** Hint text below the input */
  hint?: string;
}

export default function PhoneInput({
  countryCode,
  onCountryChange,
  value,
  onChange,
  placeholder = '6 12 34 56 78',
  className = '',
  required = false,
  dark = false,
  label,
  hint,
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selected = COUNTRY_MAP[countryCode.toUpperCase()] ?? COUNTRIES[0];

  // Extract local number from full value (strip dial code)
  const dialDigits = selected.dial.replace('+', '');
  const getLocalNumber = (fullValue: string): string => {
    const digits = fullValue.replace(/\D/g, '');
    if (digits.startsWith(dialDigits)) {
      return digits.slice(dialDigits.length);
    }
    if (digits.startsWith('00')) {
      return digits.slice(2);
    }
    // If starts with country dial prefix already with +, extract local
    if (fullValue.startsWith('+')) {
      const withoutPlus = fullValue.slice(1).replace(/\D/g, '');
      if (withoutPlus.startsWith(dialDigits)) {
        return withoutPlus.slice(dialDigits.length);
      }
      return withoutPlus;
    }
    return digits;
  };

  const localNumber = getLocalNumber(value);

  // Handle local number input change
  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/[^\d\s]/g, ''); // allow digits and spaces only
    const cleanLocal = input.replace(/\s/g, '');
    const fullNumber = `+${dialDigits}${cleanLocal}`;
    onChange(fullNumber);
  };

  // Handle country change
  const handleCountrySelect = (country: CountryInfo) => {
    onCountryChange(country.code);
    setIsOpen(false);
    setSearch('');
    // Recompute full number with new dial code
    const newDialDigits = country.dial.replace('+', '');
    const cleanLocal = localNumber.replace(/\s/g, '');
    if (cleanLocal) {
      onChange(`+${newDialDigits}${cleanLocal}`);
    }
  };

  // Filter countries by search
  const filtered = search
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.dial.includes(search) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Auto-focus search when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const textColor = dark ? 'text-white' : 'text-blue-900';
  const bgColor = dark ? 'bg-white/10' : 'bg-white';
  const borderColor = dark ? 'border-white/20' : 'border-blue-200';
  const placeholderColor = dark ? 'placeholder:text-white/40' : 'placeholder:text-blue-900/40';
  const focusRing = 'focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent';

  return (
    <div className={`w-full min-w-0 ${className}`}>
      {label && (
        <p className={`text-sm font-medium mb-1.5 ${dark ? 'text-white/80' : 'text-blue-700'}`}>
          {label}
        </p>
      )}
      <div className="flex items-stretch gap-0 min-w-0">
        {/* Country selector button */}
        <div ref={dropdownRef} className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-3 rounded-l-xl border-2 border-r-0 ${borderColor} ${bgColor} ${textColor} hover:bg-opacity-80 transition-colors min-h-[48px]`}
          >
            <span className="text-base sm:text-lg leading-none">{selected.flag}</span>
            <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">{selected.dial}</span>
            <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-60 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className={`absolute top-full left-0 mt-1 w-64 sm:w-72 max-h-72 overflow-hidden rounded-xl shadow-2xl z-50 border-2 ${dark ? 'border-white/20 bg-[#0A192F]' : 'border-blue-200 bg-white'}`}>
              {/* Search */}
              <div className={`p-2 border-b ${dark ? 'border-white/10' : 'border-blue-100'}`}>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/10">
                  <Search className="w-4 h-4 opacity-50" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un pays..."
                    className={`w-full bg-transparent text-sm ${dark ? 'text-white placeholder:text-white/40' : 'text-blue-900 placeholder:text-blue-900/40'} focus:outline-none`}
                  />
                </div>
              </div>
              {/* Country list */}
              <div className="overflow-y-auto max-h-56">
                {filtered.length === 0 ? (
                  <div className={`px-4 py-3 text-sm ${dark ? 'text-white/50' : 'text-blue-900/50'}`}>
                    Aucun pays trouvé
                  </div>
                ) : (
                  filtered.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleCountrySelect(c)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        c.code === selected.code
                          ? (dark ? 'bg-blue-500/20 text-blue-600' : 'bg-blue-50 text-blue-700')
                          : (dark ? 'text-white/80 hover:bg-white/10' : 'text-blue-900 hover:bg-blue-50')
                      }`}
                    >
                      <span className="text-lg">{c.flag}</span>
                      <span className="flex-1 text-sm font-medium truncate">{c.name}</span>
                      <span className={`text-sm font-mono ${dark ? 'text-white/50' : 'text-blue-900/50'}`}>
                        {c.dial}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phone number input */}
        <input
          type="tel"
          placeholder={placeholder}
          value={localNumber ? formatLocalNumber(localNumber) : ''}
          onChange={handleLocalChange}
          className={`flex-1 min-w-0 rounded-r-xl border-2 ${borderColor} ${bgColor} ${textColor} ${placeholderColor} ${focusRing} px-2 sm:px-3 py-2.5 text-sm sm:text-base min-h-[48px] w-0`}
          required={required}
        />
      </div>
      {hint && (
        <p className={`text-xs mt-1.5 ${dark ? 'text-white/50' : 'text-blue-900/50'}`}>
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * Format a local number with spaces for readability.
 * '612345678' → '6 12 34 56 78'
 */
function formatLocalNumber(raw: string): string {
  const digits = raw.replace(/\s/g, '');
  // Group: first digit, then pairs
  return digits.replace(/(\d{1,2})(?=\d)/g, '$1 ');
}
