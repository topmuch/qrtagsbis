'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, Luggage, Calendar, Backpack } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import SuccessOverlay from '@/components/ui/SuccessOverlay';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from '@/hooks/use-toast';

// ─── Brand constants (QRTags palette: blue #0047d6 + yellow #fcd616) ───
const BRAND = '#0047d6'; // bleu vif — fonds, boutons primaires
const ACCENT = '#fcd616'; // jaune vif — cards, accents
const INK = '#1a1a1a'; // noir — texte sur jaune, bordures dashed

interface ActivationData {
  reference: string;
  firstName: string;
  lastName: string;
  whatsapp: string;
  flightNumber?: string;
  destination?: string;
  type: string;
  activatedAt: string;
  expiresAt?: string;
  // TRANSPORT-FEATURE: Transport mode + conditional fields (conservés pour sessionStorage, non affichés)
  transportMode?: string;
  trainNumber?: string;
  shipName?: string;
  busLineNumber?: string;
}

function SuccessContent() {
  const [activationData, setActivationData] = useState<ActivationData | null>(null);
  const { t } = useTranslation();

  // Lecture unique de sessionStorage au mount — pattern légitime (storage externe non disponible au SSR)
  useEffect(() => {
    const storedData = sessionStorage.getItem('activationData');
    if (storedData) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActivationData(JSON.parse(storedData));
      } catch (e) {
        console.error('Error parsing activation data:', e);
      }
    }
  }, []);

  // Valeur dérivée — évite un useEffect + setState redondant
  const activationConfirmed = activationData !== null;

  const reference = activationData?.reference || '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const trackingUrl = `${origin}/suivi/${reference}`;
  const qrUrl = `${origin}/scan/${reference}`;

  // Format date (avec heure)
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format expiration date (sans heure)
  const formatExpiration = (dateString?: string) => {
    if (!dateString) return 'Selon formule';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Web Share API + fallback clipboard
  const handleShare = async () => {
    if (!reference) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mon objet QRTags',
          text: 'Suivez mon objet en temps réel avec QRTags.',
          url: trackingUrl,
        });
      } catch (err) {
        // Annulation utilisateur ou erreur — silencieux
      }
    } else {
      try {
        await navigator.clipboard.writeText(trackingUrl);
        toast({
          title: 'Lien copié !',
          description: 'Le lien de suivi a été copié dans le presse-papiers.',
        });
      } catch (err) {
        toast({
          title: 'Impossible de copier le lien',
          description: 'Votre navigateur ne supporte pas le copier-coller automatique.',
          variant: 'destructive',
        });
      }
    }
  };

  // ─── Empty state : pas d'activation data ───
  if (!activationData) {
    return (
      <main className="min-h-screen bg-[#0047d6] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-[#fcd616] border-2 border-dashed border-[#1a1a1a] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#1a1a1a]">
              <CheckCircle className="w-8 h-8" style={{ color: INK }} />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: INK }}>
              ✅ Activation réussie !
            </h1>
            <p className="mb-6" style={{ color: INK, opacity: 0.7 }}>
              Votre objet est maintenant protégé
            </p>
            <Link
              href="/inscrire"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors min-h-[48px]"
              style={{ backgroundColor: INK, color: ACCENT }}
            >
              ← Revenir à l&apos;inscription
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0047d6] flex items-center justify-center p-4">
      {/* SuccessOverlay — feedback premium d'activation (indépendant du thème) */}
      <SuccessOverlay show={activationConfirmed} messageKey="activation.success" t={t} />

      <div className="max-w-md w-full py-6">
        {/* ═══ 1. En-tête succès ═══ */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-3">
            <div
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-2"
              style={{ borderColor: INK }}
            >
              <CheckCircle className="w-10 h-10" style={{ color: INK }} />
            </div>
            <div
              className="absolute inset-0 w-20 h-20 rounded-full animate-ping"
              style={{ backgroundColor: ACCENT, opacity: 0.3 }}
            />
          </div>
          <h1 className="text-2xl font-bold mb-1 text-white">
            ✅ Activation réussie !
          </h1>
          <p className="text-white/80">Votre objet est maintenant protégé</p>
        </div>

        {/* ═══ 2. Carte QR Code (fond jaune QRTags + bordure dashed noire) ═══ */}
        <div
          className="border-2 border-dashed rounded-2xl p-5 mb-4 text-center"
          style={{ backgroundColor: ACCENT, borderColor: INK }}
        >
          {/* QR Code sur fond blanc pour scan optimal */}
          <div className="bg-white rounded-xl p-3 inline-block mb-3">
            <QRCodeSVG
              value={qrUrl}
              size={160}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor={INK}
            />
          </div>
          <p className="font-mono font-bold text-lg break-all" style={{ color: INK }}>
            {reference}
          </p>
          <p className="text-sm" style={{ color: INK, opacity: 0.7 }}>
            {activationData.firstName} {activationData.lastName}
          </p>
        </div>

        {/* ═══ 3. Résumé Activité (bloc blanc épuré + bordure dashed noire) ═══ */}
        <div
          className="bg-white border-2 border-dashed rounded-2xl p-4 mb-4 space-y-3"
          style={{ borderColor: INK }}
        >
          <div className="flex items-center gap-3">
            <Luggage className="w-5 h-5 flex-shrink-0" style={{ color: INK }} />
            <p className="font-medium text-sm" style={{ color: INK }}>
              🧳 1 objet activé •{' '}
              <span style={{ color: INK, opacity: 0.7 }}>Protection active</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 flex-shrink-0" style={{ color: INK }} />
            <p className="font-medium text-sm" style={{ color: INK }}>
              ⏰ Expire le {formatExpiration(activationData.expiresAt)} •{' '}
              <span style={{ color: INK, opacity: 0.7 }}>
                Activé le {formatDate(activationData.activatedAt)}
              </span>
            </p>
          </div>
        </div>

        {/* ═══ 4. Boutons d'Action (flex-col mobile, flex-row md) ═══ */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          {/* Bouton A : Suivre mon objet (target _blank) */}
          <a
            href={`/suivi/${reference}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Suivre mon objet dans un nouvel onglet"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold transition-colors min-h-[52px] border-2"
            style={{ backgroundColor: INK, color: ACCENT, borderColor: INK }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = ACCENT;
              e.currentTarget.style.color = INK;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = INK;
              e.currentTarget.style.color = ACCENT;
            }}
          >
            📍 Suivre mon objet
          </a>

          {/* Bouton B : Partager (Web Share API + fallback clipboard) */}
          <button
            onClick={handleShare}
            aria-label="Partager le lien de suivi"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-bold transition-colors min-h-[52px] border-2 cursor-pointer"
            style={{ backgroundColor: INK, color: ACCENT, borderColor: INK }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = ACCENT;
              e.currentTarget.style.color = INK;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = INK;
              e.currentTarget.style.color = ACCENT;
            }}
          >
            📤 Partager
          </button>
        </div>

        {/* ═══ 5. Encart Checklist (fond jaune QRTags + bordure dashed noire) ═══ */}
        <div
          className="border-2 border-dashed rounded-2xl p-5 text-center"
          style={{ backgroundColor: ACCENT, borderColor: INK }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Backpack className="w-5 h-5" style={{ color: INK }} />
            <h2 className="font-bold text-base" style={{ color: INK }}>
              🎒 Préparez votre voyage sereinement
            </h2>
          </div>
          <Link
            href="/checklist"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold transition-colors min-h-[48px]"
            style={{ backgroundColor: INK, color: ACCENT }}
          >
            Créer ma checklist gratuite →
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return <SuccessContent />;
}
