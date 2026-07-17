'use client';

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[#080c1a] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="w-20 h-20 bg-gradient-to-br from-[#b8860b] to-[#3b82f6] rounded-2xl flex items-center justify-center mx-auto mb-8">
          <svg
            className="w-10 h-10 text-[#080c1a]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="3" height="3" />
            <rect x="18" y="18" width="3" height="3" />
          </svg>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-white mb-4">
          Pas de connexion
        </h1>
        <p className="text-[#a0a8b8] mb-8">
          Vérifiez votre connexion internet et réessayez.
        </p>

        {/* Retry Button */}
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-[#b8860b] text-white font-semibold rounded-lg hover:bg-[#3b82f6] transition-colors"
        >
          Réessayer
        </button>

        {/* Info */}
        <p className="mt-8 text-[#a0a8b8]/60 text-sm">
          QRTags fonctionne également hors ligne pour les fonctions de base.
        </p>
      </div>
    </main>
  );
}
