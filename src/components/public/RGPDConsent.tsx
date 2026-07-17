'use client';

import { useSyncExternalStore, useCallback } from 'react';
import Link from 'next/link';

// Store externe pour le consentement RGPD
function getConsentSnapshot() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('qrtags_rgpd_consent');
}

function getServerSnapshot() {
  return null;
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

export default function RGPDConsent() {
  const consent = useSyncExternalStore(subscribe, getConsentSnapshot, getServerSnapshot);

  const handleAccept = useCallback(() => {
    localStorage.setItem('qrtags_rgpd_consent', 'accepted');
    window.dispatchEvent(new Event('storage'));
    
    // Activer Google Analytics si disponible
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('consent', 'update', {
        'analytics_storage': 'granted'
      });
    }
  }, []);

  const handleReject = useCallback(() => {
    localStorage.setItem('qrtags_rgpd_consent', 'rejected');
    window.dispatchEvent(new Event('storage'));
  }, []);

  // Ne pas afficher si consentement déjà donné
  if (consent !== null) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0a0f2c] border-t border-[#1a1a3a] p-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[#e0e6f0] text-sm text-center md:text-left">
          Ce site utilise des cookies pour améliorer votre expérience.{' '}
          <Link href="/confidentialite" className="text-[#b8860b] hover:underline ml-1">
            En savoir plus
          </Link>
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleReject}
            className="px-4 py-2 bg-[#7a1e1e] text-white text-sm rounded-lg hover:bg-[#8a2e2e] transition-colors font-medium"
          >
            Refuser
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-[#1e7e34] text-white text-sm rounded-lg hover:bg-[#1a6b2c] transition-colors font-medium"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
