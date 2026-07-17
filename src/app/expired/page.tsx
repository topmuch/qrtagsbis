'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Clock,
  MessageCircle,
  Home,
  RefreshCw,
  Shield,
  AlertTriangle
} from "lucide-react";

function ExpiredContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get('ref') || '';
  const agencyName = searchParams.get('agency') || '';
  const expiredAt = searchParams.get('expired') || '';

  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Bonjour,\n\n` +
      `J'ai scanné un QR code QRTags qui a expiré.\n\n` +
      `📦 Référence: ${reference}\n` +
      `📅 Expiré le: ${formatDate(expiredAt)}\n\n` +
      `Je souhaite renouveler la protection de ce objet.`
    );
    window.open(`https://wa.me/33745349339?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#080c1a] to-[#0d1220] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className="w-20 h-20 bg-[#7a1e1e]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-red-400" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-2">
          Ce QR code est expiré
        </h1>
        
        <p className="text-[#a0a8b8] mb-8">
          Le objet associé à{' '}
          <span className="font-mono bg-slate-800 px-2 py-1 rounded text-blue-500">
            {reference || 'ce code'}
          </span>
          {expiredAt && (
            <>
              {' '}n'est plus protégé depuis le{' '}
              <span className="text-white font-medium">{formatDate(expiredAt)}</span>.
            </>
          )}
        </p>

        {/* Warning Box */}
        <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4 mb-6 text-left">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 font-medium text-sm">Que faire ?</p>
              <p className="text-amber-200/70 text-sm mt-1">
                Si vous êtes le propriétaire, contactez votre agence pour générer un nouveau QR code. 
                Si vous avez trouvé ce objet, vous pouvez nous contacter pour aider à le retrouver.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleWhatsApp}
            className="w-full py-3.5 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <MessageCircle className="w-5 h-5" />
            Contacter via WhatsApp
          </button>

          {agencyName && (
            <p className="text-sm text-[#a0a8b8]">
              Agence : <span className="text-white font-medium">{agencyName}</span>
            </p>
          )}

          <button
            onClick={() => router.push('/')}
            className="w-full py-3.5 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 border border-slate-700"
          >
            <Home className="w-5 h-5" />
            Retour à l'accueil
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <div className="flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-slate-400 shrink-0" />
            <div className="text-left">
              <p className="text-slate-300 font-medium text-sm">Comment renouveler ?</p>
              <p className="text-slate-400 text-xs mt-1">
                Contactez votre agence de voyage ou rendez-vous sur QRTags.com pour générer un nouveau QR code. 
                La protection standard dure 7 jours, et jusqu'à 1 an avec un tag premium.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-[#a0a8b8]/70 text-xs">
          <Shield className="w-4 h-4 inline mr-1" />
          QRTags – Protégez vos objets, en toute sérénité
        </div>
      </div>
    </div>
  );
}

export default function ExpiredQRPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#080c1a] to-[#0d1220] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full"></div>
      </div>
    }>
      <ExpiredContent />
    </Suspense>
  );
}
