'use client';

import Link from 'next/link';
import { QrCode, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080c1a] flex items-center justify-center px-4">
      <div className="text-center text-white max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <img src="/logo.png" alt="QRTags" className="h-16 w-auto object-contain" />
        </div>

        {/* 404 */}
        <h1 className="text-8xl font-bold bg-gradient-to-r from-[#1E40AF] to-[#1D4ED8] bg-clip-text text-transparent mb-4">
          404
        </h1>

        {/* Message */}
        <h2 className="text-2xl font-bold text-white mb-4">
          Page non trouvée
        </h2>
        <p className="text-[#a0a8b8] mb-8 leading-relaxed">
          La page que vous recherchez n&apos;existe pas ou a été déplacée. 
          Vérifiez l&apos;URL ou retournez à l&apos;accueil.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-[#1E40AF] hover:bg-[#e01e5a] text-white px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 shadow-lg shadow-[#1E40AF]/30"
          >
            <Home className="w-5 h-5" />
            Retour à l&apos;accueil
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 bg-transparent border-2 border-[#a0a8b8] hover:border-white text-[#a0a8b8] hover:text-white px-6 py-3 rounded-lg font-bold transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Page précédente
          </button>
        </div>

        {/* Help text */}
        <p className="text-[#a0a8b8] text-sm mt-8">
          Besoin d&apos;aide ?{' '}
          <Link href="/contact" className="text-[#1E40AF] hover:underline">
            Contactez-nous
          </Link>
        </p>
      </div>
    </div>
  );
}
