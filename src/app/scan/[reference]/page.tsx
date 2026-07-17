'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import {
  Luggage,
  AlertCircle,
  Clock,
  Shield,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Globe,
  Phone,
  MessageCircle,
} from "lucide-react";
import { useTranslation } from '@/hooks/useTranslation';
import { Language, LANGUAGE_NAMES } from '@/lib/i18n';
import dynamic from 'next/dynamic';
import SuccessOverlay from '@/components/ui/SuccessOverlay';
import PhoneInput from '@/components/ui/PhoneInput';
import { toast } from '@/hooks/use-toast';

// TRANSPORT-FEATURE: Multi-transport support (real images, emojis as fallback)
import {
  safeTransportMode,
  getTransportImage,
  getTransportBlockHeader,
  TRANSPORT_ICONS,
} from '@/lib/transport';
import type { TransportMode } from '@/lib/transport';
import TransportModeSelector from '@/components/inscrire/TransportModeSelector';

// AI-FEATURE: Lazy-load ChatbotWidget (Feature #1) — doesn't block page render
const ChatbotWidget = dynamic(() => import('@/components/finder/ChatbotWidget'), {
  ssr: false,
  loading: () => null,
});

// ─── Brand constants (QRTags palette: blue #10B981 + yellow #F59E0B) ───
const BRAND = '#10B981';   // bleu vif — fonds principaux
const ACCENT = '#F59E0B'; // jaune vif — cards, accents
const INK = '#1a1a1a';    // noir — texte sur jaune, bordures dashed
const CREAM = '#10B981';  // (alias — désormais bleu QRTags)

const FALLBACK_PHONE = '33745349339';

interface BaggageData {
  status: string;
  message?: string;
  theme?: string;
  type?: string;
  expiredAt?: string;
  agency?: string;
  baggage?: {
    reference: string;
    type: string;
    travelerName: string;
    baggageIndex: number;
    baggageType: string;
    status: string;
    airlineName?: string;
    flightNumber?: string;
    destination?: string;
    agency?: string;
    whatsappOwner?: string;
    declaredLostAt?: string | null;
    foundAt?: string | null;
    createdAt?: string | null;
    departureDate?: string | null;
    departureTime?: string | null;
    // TRANSPORT-FEATURE: Transport mode + conditional fields
    transportMode?: string;
    trainCompany?: string | null;
    trainNumber?: string | null;
    shipName?: string | null;
    shipCabin?: string | null;
    busCompany?: string | null;
    busLineNumber?: string | null;
  };
}

// ─── Language Selector Component (light theme, brand-aware) ───
function LanguageSelector({ lang, setLang }: { lang: Language; setLang: (l: Language) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-white border-2 border-[#1a1a1a] rounded-full text-[#1a1a1a] hover:bg-[#F59E0B] transition-colors text-xs sm:text-sm md:text-base font-medium shadow-sm min-h-[36px] sm:min-h-[40px] md:min-h-[44px]"
      >
        <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
        <span>{LANGUAGE_NAMES[lang]}</span>
      </button>

      {isOpen && (
        <div role="listbox" aria-label="Language" className="absolute top-full right-0 mt-1 sm:mt-2 bg-white border-2 border-[#1a1a1a] rounded-xl shadow-lg overflow-hidden z-50 min-w-[140px] sm:min-w-[160px]">
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
                  ? 'bg-[#F59E0B] text-[#1a1a1a]'
                  : 'text-[#1a1a1a] hover:bg-[#F59E0B]/30'
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

// ─── Activation Redirect Component (recolored with brand) ───
// ACTIVATION-FLOW: User selects transport mode BEFORE being redirected to /inscrire?qr=REF&mode=XXX.
function ActivationRedirect({ type, reference, t, lang, setLang }: {
  type: string;
  reference: string;
  t: (key: string, params?: Record<string, string>) => string;
  lang: Language;
  setLang: (l: Language) => void;
}) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<TransportMode | ''>('');

  const isHajj = type === 'hajj';

  const handleContinue = () => {
    const url = isHajj
      ? `/hajj/activate?qr=${reference}`
      : `/inscrire?qr=${reference}${selectedMode ? `&mode=${selectedMode}` : ''}`;
    router.push(url);
  };

  return (
    <main className="min-h-screen bg-[#10B981] flex items-center justify-center p-5 md:p-8">
      <div className="relative max-w-md w-full bg-[#F59E0B] border-2 border-dashed border-[#1a1a1a] rounded-2xl p-6 md:p-8 text-center shadow-xl">
        <div className="absolute top-4 right-4">
          <LanguageSelector lang={lang} setLang={setLang} />
        </div>

        <div className="relative inline-block mb-5 mt-6">
          <div className="w-16 h-16 bg-white border-2 border-[#1a1a1a] rounded-full flex items-center justify-center">
            {selectedMode ? (
              <Image
                src={getTransportImage(selectedMode)}
                alt={selectedMode}
                width={36}
                height={36}
                className="mix-blend-multiply"
              />
            ) : (
              <Luggage className="w-8 h-8 text-[#1a1a1a]" />
            )}
          </div>
          <div className="absolute -top-1 -right-1 w-7 h-7 bg-[#1a1a1a] rounded-full flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] mb-1">
          {t('common.welcome')}
        </h1>
        <p className="text-[#1a1a1a]/70 text-sm md:text-base mb-5">
          {t('inscrire.subtitle')}
        </p>

        {isHajj && (
          <>
            <div className="border-2 border-dashed border-[#1a1a1a] rounded-xl p-4 mb-5 bg-white/40">
              <p className="text-[#1a1a1a]/80 text-sm mb-2">{t('common.baggage_type')}</p>
              <Badge className="bg-[#1a1a1a] text-white text-base md:text-lg px-5 py-1.5">
                {t('common.hajj_label')}
              </Badge>
            </div>
            <button
              className="w-full py-4 px-6 bg-[#1a1a1a] hover:bg-black text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 min-h-[56px]"
              onClick={handleContinue}
            >
              {t('common.start_activation')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}

        {!isHajj && (
          <>
            <div className="border-2 border-dashed border-[#1a1a1a] rounded-xl p-4 mb-5 bg-white/40">
              <p className="text-[#1a1a1a]/80 text-sm mb-2">{t('common.baggage_type')}</p>
              <Badge className="bg-[#1a1a1a] text-white text-base md:text-lg px-5 py-1.5">
                {t('common.voyageur_label')}
              </Badge>
            </div>

            <div className="text-left mb-5">
              <p className="text-[#1a1a1a] font-semibold text-sm mb-3 text-center">
                {t('transport.select_mode')}
              </p>
              <TransportModeSelector
                selectedMode={selectedMode}
                onSelect={setSelectedMode}
                t={t}
                lang={lang}
              />
            </div>

            <button
              className="w-full py-4 px-6 bg-[#1a1a1a] hover:bg-black disabled:bg-[#1a1a1a]/30 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 min-h-[56px]"
              onClick={handleContinue}
              disabled={!selectedMode}
            >
              {t('common.start_activation')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </main>
  );
}

// ─── Loading Component (recolored) ───
function LoadingScreen({ t }: { t: (key: string) => string }) {
  return (
    <main className="min-h-screen bg-[#10B981] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-white/20 border-t-[#F59E0B] rounded-full mx-auto mb-4"></div>
        <p className="text-lg text-white">{t('common.loading')}</p>
      </div>
    </main>
  );
}

// ─── Error Screen (recolored) ───
function ErrorScreen({
  type,
  t,
  lang,
  setLang
}: {
  type: string;
  t: (key: string) => string;
  lang: Language;
  setLang: (l: Language) => void;
}) {
  const router = useRouter();

  const errorConfig = {
    not_found: {
      icon: <AlertCircle className="w-12 h-12 text-red-500" />,
      title: t('errors.qr_not_valid'),
      message: t('errors.qr_not_valid_desc')
    },
    blocked: {
      icon: <Shield className="w-12 h-12 text-[#1a1a1a]/40" />,
      title: t('errors.baggage_blocked'),
      message: t('errors.baggage_blocked_desc')
    },
    expired: {
      icon: <Clock className="w-12 h-12 text-[#1a1a1a]/40" />,
      title: t('errors.protection_expired'),
      message: t('errors.protection_expired_desc')
    }
  };

  const config = errorConfig[type as keyof typeof errorConfig] || errorConfig.not_found;

  return (
    <main className="min-h-screen bg-[#10B981] flex items-center justify-center p-5 md:p-8 relative">
      <div className="absolute top-4 right-4">
        <LanguageSelector lang={lang} setLang={setLang} />
      </div>

      <div className="max-w-md w-full bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-6 md:p-8 text-center shadow-xl">
        <div className="w-20 h-20 bg-[#F59E0B]/30 border-2 border-dashed border-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-6">
          {config.icon}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] mb-3">{config.title}</h1>
        <p className="text-[#1a1a1a] text-base md:text-lg mb-6">{config.message}</p>
        <button
          className="w-full py-4 px-6 bg-[#1a1a1a] hover:bg-black text-white rounded-xl hover:bg-[#F59E0B] hover:text-[#1a1a1a] transition-colors text-base font-medium min-h-[56px]"
          onClick={() => router.push('/')}
        >
          {t('common.back_home')}
        </button>
      </div>
    </main>
  );
}

// ─── Dashed Encart Helper (light variant: dashed black on white) ───
function DashedEncart({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border-2 border-dashed border-[#1a1a1a]/60 rounded-xl p-3 mb-2.5 last:mb-0 ${className}`}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── MAIN SCAN PAGE ───
// ═══════════════════════════════════════════════════════════════
export default function ScanPage() {
  const params = useParams();
  const reference = params.reference as string;

  const { t, lang, setLang, dir, countryCode } = useTranslation();

  const [baggageData, setBaggageData] = useState<BaggageData | null>(null);
  const [loading, setLoading] = useState(true);

  // UI State
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Finder form state
  const [finderName, setFinderName] = useState('');
  const [finderPhone, setFinderPhone] = useState('');
  const [finderPhoneCountry, setFinderPhoneCountry] = useState(countryCode);
  const [otherLocation, setOtherLocation] = useState('');
  // GPS is now captured INLINE inside handleWhatsApp (no separate button/state).
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SuccessOverlay state
  const [scanConfirmed, setScanConfirmed] = useState(false);
  const hasConfirmedRef = useRef(false);

  useEffect(() => {
    const fetchBaggage = async () => {
      try {
        const response = await fetch(`/api/scan/${reference}`);
        const data = await response.json();
        setBaggageData(data);
      } catch (error) {
        console.error('Error fetching baggage:', error);
        setBaggageData({ status: 'error', message: 'Erreur serveur' });
      } finally {
        setLoading(false);
      }
    };

    fetchBaggage();
  }, [reference]);

  // Trigger SuccessOverlay once when baggage loads successfully
  useEffect(() => {
    if (baggageData?.baggage?.reference && !hasConfirmedRef.current) {
      hasConfirmedRef.current = true;
      setScanConfirmed(true);
    }
  }, [baggageData?.baggage?.reference]);

  // NOTE: GPS sharing now happens inline inside handleWhatsApp (silent fallback to manual location).
  // The dedicated "Partager ma position GPS" button was removed per refonte-6 brief.

  // Generate WhatsApp message — new template (refonte-7): friendly notification to the owner
  const generateWhatsAppMessage = useCallback((
    finderName: string,
    finderPhone: string,
    locationText: string,
    mapLink: string,
    travelerName: string,
    baggageType: string
  ) => {
    const trackingUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://qrtagss.com'}/suivi/${reference}`;

    // Extract owner's first name from full name
    const firstName = travelerName.split(' ')[0] || travelerName || '';

    // Baggage type label (voyageur/hajj) — i18n-aware
    const typeLabel = baggageType === 'hajj'
      ? t('common.hajj_label')
      : t('common.voyageur_label');

    // [Lieu] = where the bag was found (manual text, GPS coords, or fallback label)
    const location = locationText || t('whatsapp.gps_shared_label');

    // [Adresse] = current precise address (Google Maps link if GPS, else same as location, else fallback)
    const address = mapLink.startsWith('http')
      ? mapLink
      : (locationText || t('whatsapp.location_not_shared'));

    // Build message using the template (refonte-7)
    return encodeURIComponent(
      t('whatsapp.found_message', {
        firstName,
        type: typeLabel,
        location,
        address,
        name: finderName,
        phone: finderPhone,
        url: trackingUrl,
      })
    );
  }, [reference, t]);

  // Log scan to API (shared by WhatsApp + Phone flows).
  // sharedPos/locText are passed as params (no longer state) — GPS is captured inline in handleWhatsApp.
  const logScan = useCallback(async (
    sharedPos?: { lat: number; lng: number } | null,
    locText?: string
  ) => {
    try {
      await fetch(`/api/scan/${reference}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: otherLocation.trim() || locText || t('finder.not_specified'),
          finderName: finderName.trim(),
          finderPhone: finderPhone.trim(),
          message: '',
          latitude: sharedPos?.lat,
          longitude: sharedPos?.lng,
        }),
      });
    } catch (e) {
      // Continue with contact even if logging fails
      console.error('Log scan failed:', e);
    }
  }, [reference, otherLocation, finderName, finderPhone, t]);

  // Handle WhatsApp contact — GPS is captured INLINE with silent fallback to manual location.
  // Flow: validate name+phone → try GPS (10s timeout, silent fail) → log scan → open wa.me
  const handleWhatsApp = useCallback(async () => {
    // Inline validation (name + phone required; location optional since GPS is auto)
    if (!finderName.trim() || !finderPhone.trim()) {
      toast({ title: t('finder.fill_info'), variant: 'destructive' });
      return;
    }

    // Step 1: try to get GPS automatically (silent fallback if it fails)
    setIsLocating(true);
    let sharedPos: { lat: number; lng: number } | null = null;
    let locText = '';

    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });
        sharedPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        locText = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
      } catch {
        // Silent fallback — use manual location or "not specified"
        toast({ title: t('finder.gps_fallback_toast') });
      }
    }

    setIsLocating(false);
    setIsSubmitting(true);

    try {
      await logScan(sharedPos, locText);

      const finalLocationText = locText || otherLocation.trim() || t('finder.not_specified');
      const mapLink = sharedPos
        ? `https://maps.app.goo.gl/?link=https://www.google.com/maps?q=${sharedPos.lat},${sharedPos.lng}`
        : t('whatsapp.location_not_shared');

      const message = generateWhatsAppMessage(
        finderName,
        finderPhone,
        finalLocationText,
        mapLink,
        baggageData?.baggage?.travelerName || '',
        baggageData?.baggage?.type || 'voyageur'
      );
      const ownerNumber = baggageData?.baggage?.whatsappOwner?.replace(/\D/g, '') || FALLBACK_PHONE;
      // Use api.whatsapp.com directly instead of wa.me — wa.me corrupts 4-byte UTF-8 emojis (🎉📍👤📞💬👉💪)
      // during its redirect to api.whatsapp.com (replaces them with U+FFFD replacement character).
      const url = `https://api.whatsapp.com/send/?phone=${ownerNumber}&text=${message}`;

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      if (isIOS) {
        window.location.href = url;
      } else {
        const newWindow = window.open(url, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          window.location.href = url;
        }
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
      toast({ title: t('finder.success_title'), description: t('finder.message_sent') });
    } catch (error) {
      console.error('Error:', error);
      toast({ title: t('errors.error_occurred'), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }, [finderName, finderPhone, t, logScan, otherLocation, baggageData, generateWhatsAppMessage]);

  // Handle phone call — opens tel:${phone}. No GPS (no message to embed it in).
  const handlePhoneCall = useCallback(async () => {
    // Inline validation (same as WhatsApp: name + phone required)
    if (!finderName.trim() || !finderPhone.trim()) {
      toast({ title: t('finder.fill_info'), variant: 'destructive' });
      return;
    }

    await logScan(null, '');

    const phoneNumber = baggageData?.baggage?.whatsappOwner || FALLBACK_PHONE;
    window.location.href = `tel:${phoneNumber}`;
  }, [finderName, finderPhone, t, logScan, baggageData]);

  // Format date for display
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const locale = lang === 'ar' ? 'ar-SA' : lang === 'en' ? 'en-US' : 'fr-FR';
    return new Date(dateStr).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // NOTE: validateFinderForm was removed — validation is now inlined in handleWhatsApp/handlePhoneCall.
  // Location is no longer required (GPS is auto-captured inside handleWhatsApp).

  // ─── Loading state ───
  if (loading) {
    return <LoadingScreen t={t} />;
  }

  // ─── Redirect to activation if pending ───
  if (baggageData?.status === 'pending_activation' && baggageData?.type) {
    return (
      <ActivationRedirect
        type={baggageData.type}
        reference={reference}
        t={t}
        lang={lang}
        setLang={setLang}
      />
    );
  }

  // ─── Error states ───
  if (baggageData?.status === 'not_found') {
    return <ErrorScreen type="not_found" t={t} lang={lang} setLang={setLang} />;
  }

  if (baggageData?.status === 'blocked') {
    return <ErrorScreen type="blocked" t={t} lang={lang} setLang={setLang} />;
  }

  if (baggageData?.status === 'expired') {
    const expiredAt = baggageData.expiredAt || '';
    const agencyName = baggageData.agency || '';
    const urlParams = new URLSearchParams({
      ref: reference,
      ...(expiredAt && { expired: expiredAt }),
      ...(agencyName && { agency: agencyName })
    });
    if (typeof window !== 'undefined') {
      window.location.href = `/expired?${urlParams.toString()}`;
    }
    return <LoadingScreen t={t} />;
  }

  const baggage = baggageData?.baggage;
  const isDeclaredLost = baggage?.declaredLostAt && !baggage?.foundAt;

  // ═══════════════════════════════════════════════════════════════
  // ─── MAIN RENDER — Cream bg + White dashed cards + Yellow finder encart ───
  // ═══════════════════════════════════════════════════════════════
  return (
    <main
      className="min-h-screen bg-[#10B981] flex flex-col px-4 sm:px-5 md:px-8 pb-[env(safe-area-inset-bottom,0px)]"
      dir={dir}
    >
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 flex items-center justify-end pt-[env(safe-area-inset-top,0px)] px-0 py-2 sm:py-3 md:py-4 bg-[#10B981]">
        <LanguageSelector lang={lang} setLang={setLang} />
      </header>

      {/* SuccessOverlay — Premium scan confirmation */}
      <SuccessOverlay show={scanConfirmed} messageKey="scan.success" t={t} />

      {/* Success Toast — inline confirmation */}
      {showSuccess && (
        <div className="fixed top-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:top-[calc(4rem+env(safe-area-inset-top,0px))] right-3 sm:right-5 bg-[#1a1a1a] text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl shadow-lg z-50 animate-in slide-in-from-right duration-300 max-w-[calc(100vw-2rem)] sm:max-w-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-[#F59E0B]" />
            <div>
              <div className="font-bold text-lg">{t('finder.success_title')} 🎉</div>
              <div className="text-base opacity-90">{t('finder.message_sent')}</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Container ─── */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col py-4 sm:py-6 md:py-2">

        {/* ═══ 🏷️ TITRE : ✅ BAGAGE TROUVÉ ═══ */}
        <div className="text-center mb-5 sm:mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
            {isDeclaredLost
              ? `🚨 ${t('finder.lost_badge')}`
              : `✅ ${t('finder.success_badge')}`}
          </h1>
          <p className="mt-2 text-sm md:text-base text-white/80 leading-relaxed max-w-md mx-auto">
            {isDeclaredLost
              ? t('finder.lost_description')
              : t('finder.objet_trouve_desc')}
          </p>
        </div>

        {/* ═══ 🟦 BLOC 1 : IDENTITÉ PROPRIÉTAIRE (white + dashed black) ═══ */}
        {baggage && (
          <div className="w-full bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-5 md:p-6 mb-4">
            <h2 className="text-xs uppercase tracking-widest text-[#1a1a1a] font-bold mb-3 flex items-center gap-2">
              <span>👤</span> {t('finder.owner_section')}
            </h2>

            {/* Full Name — kept */}
            <DashedEncart>
              <div className="flex items-center gap-3">
                <span className="text-xl">👤</span>
                <div>
                  <p className="text-xs text-[#1a1a1a]/60 font-medium">{t('finder.fullName')}</p>
                  <p className="text-base md:text-lg font-bold text-[#1a1a1a]">{baggage.travelerName || t('finder.notSet')}</p>
                </div>
              </div>
            </DashedEncart>

            {/* NOTE: Agency + Baggage Type REMOVED per refonte-4 brief */}

            {/* Contact — Secured (NEVER show WhatsApp number) */}
            <DashedEncart className="mb-0">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔒</span>
                <div>
                  <p className="text-xs text-[#1a1a1a]/60 font-medium">{t('finder.contact_label')}</p>
                  <p className="text-base font-bold text-[#1a1a1a]">{t('finder.secure_contact')}</p>
                  <p className="text-xs text-[#1a1a1a]/60 mt-0.5">{t('finder.contact_reveal_note')}</p>
                </div>
              </div>
            </DashedEncart>
          </div>
        )}

        {/* ═══ 🟦 BLOC 2 : DÉTAILS DU VOYAGE (white + dashed black, transport images) ═══ */}
        {baggage && (() => {
          const mode = safeTransportMode(baggage.transportMode) as TransportMode;
          const transportImg = getTransportImage(mode);
          const blockHeader = getTransportBlockHeader(mode, lang);

          return (
            <div className="w-full bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-5 md:p-6 mb-4">
              <h2 className="text-xs uppercase tracking-widest text-[#1a1a1a] font-bold mb-3 flex items-center gap-2">
                <Image
                  src={transportImg}
                  alt={mode}
                  width={18}
                  height={18}
                  className="mix-blend-multiply"
                />
                <span>{blockHeader}</span>
              </h2>

              {/* TRANSPORT-FEATURE: Flight info */}
              {mode === 'flight' && (baggage.airlineName || baggage.flightNumber) && (
                <DashedEncart>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {baggage.airlineName && (
                        <div className="mb-1.5">
                          <p className="text-xs text-[#1a1a1a]/60 font-medium">{t('transport.airline')}</p>
                          <p className="text-base font-bold text-[#1a1a1a]">{baggage.airlineName}</p>
                        </div>
                      )}
                      {baggage.flightNumber && (
                        <div>
                          <p className="text-xs text-[#1a1a1a]/60 font-medium">{t('transport.flight_number')}</p>
                          <p className="text-xl font-bold text-[#1a1a1a] font-mono tracking-widest">{baggage.flightNumber}</p>
                        </div>
                      )}
                    </div>
                    <div className="h-12 w-12 rounded-full bg-[#F59E0B]/20 border border-[#1a1a1a]/20 flex items-center justify-center ml-4 flex-shrink-0">
                      <Image
                        src={transportImg}
                        alt="flight"
                        width={28}
                        height={28}
                        className="mix-blend-multiply"
                      />
                    </div>
                  </div>
                </DashedEncart>
              )}

              {/* TRANSPORT-FEATURE: Train info */}
              {mode === 'train' && (baggage.trainCompany || baggage.trainNumber) && (
                <DashedEncart>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {baggage.trainCompany && (
                        <div className="mb-1.5">
                          <p className="text-xs text-[#1a1a1a]/60 font-medium">{t('transport.train_company')}</p>
                          <p className="text-base font-bold text-[#1a1a1a]">{baggage.trainCompany}</p>
                        </div>
                      )}
                      {baggage.trainNumber && (
                        <div>
                          <p className="text-xs text-[#1a1a1a]/60 font-medium">{t('transport.train_number')}</p>
                          <p className="text-xl font-bold text-[#1a1a1a] font-mono tracking-widest">{baggage.trainNumber}</p>
                        </div>
                      )}
                    </div>
                    <div className="h-12 w-12 rounded-full bg-[#F59E0B]/20 border border-[#1a1a1a]/20 flex items-center justify-center ml-4 flex-shrink-0">
                      <Image
                        src={transportImg}
                        alt="train"
                        width={28}
                        height={28}
                        className="mix-blend-multiply"
                      />
                    </div>
                  </div>
                </DashedEncart>
              )}

              {/* TRANSPORT-FEATURE: Boat info */}
              {mode === 'boat' && (baggage.shipName || baggage.shipCabin) && (
                <DashedEncart>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {baggage.shipName && (
                        <div className="mb-1.5">
                          <p className="text-xs text-[#1a1a1a]/60 font-medium">{t('transport.ship_name')}</p>
                          <p className="text-base font-bold text-[#1a1a1a]">{baggage.shipName}</p>
                        </div>
                      )}
                      {baggage.shipCabin && (
                        <div>
                          <p className="text-xs text-[#1a1a1a]/60 font-medium">{t('transport.ship_cabin')}</p>
                          <p className="text-base font-bold text-[#1a1a1a]">{baggage.shipCabin}</p>
                        </div>
                      )}
                    </div>
                    <div className="h-12 w-12 rounded-full bg-[#F59E0B]/20 border border-[#1a1a1a]/20 flex items-center justify-center ml-4 flex-shrink-0">
                      <Image
                        src={transportImg}
                        alt="boat"
                        width={28}
                        height={28}
                        className="mix-blend-multiply"
                      />
                    </div>
                  </div>
                </DashedEncart>
              )}

              {/* TRANSPORT-FEATURE: Bus info */}
              {mode === 'bus' && (baggage.busCompany || baggage.busLineNumber) && (
                <DashedEncart>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {baggage.busCompany && (
                        <div className="mb-1.5">
                          <p className="text-xs text-[#1a1a1a]/60 font-medium">{t('transport.bus_company')}</p>
                          <p className="text-base font-bold text-[#1a1a1a]">{baggage.busCompany}</p>
                        </div>
                      )}
                      {baggage.busLineNumber && (
                        <div>
                          <p className="text-xs text-[#1a1a1a]/60 font-medium">{t('transport.bus_line')}</p>
                          <p className="text-base font-bold text-[#1a1a1a]">{baggage.busLineNumber}</p>
                        </div>
                      )}
                    </div>
                    <div className="h-12 w-12 rounded-full bg-[#F59E0B]/20 border border-[#1a1a1a]/20 flex items-center justify-center ml-4 flex-shrink-0">
                      <Image
                        src={transportImg}
                        alt="bus"
                        width={28}
                        height={28}
                        className="mix-blend-multiply"
                      />
                    </div>
                  </div>
                </DashedEncart>
              )}

              {/* Destination */}
              {baggage.destination && (
                <DashedEncart>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📍</span>
                    <div>
                      <p className="text-xs text-[#1a1a1a]/60 font-medium">{t('transport.common_destination')}</p>
                      <p className="text-base font-bold text-[#1a1a1a]">{baggage.destination}</p>
                    </div>
                  </div>
                </DashedEncart>
              )}

              {/* Departure Date */}
              {(baggage.departureDate || baggage.createdAt) && (
                <DashedEncart className="mb-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📅</span>
                    <div>
                      <p className="text-xs text-[#1a1a1a]/60 font-medium">{t('transport.common_departure_date')}</p>
                      <p className="text-base font-bold text-[#1a1a1a]">
                        {formatDate(baggage.departureDate || baggage.createdAt)}{baggage.departureTime ? ` — ${baggage.departureTime}` : ''}
                      </p>
                    </div>
                  </div>
                </DashedEncart>
              )}
            </div>
          );
        })()}

        {/* ═══ 🟡 BLOC 3 : ENCART FINDER (yellow #F59E0B + solid black border) ═══ */}
        <div className="w-full bg-[#F59E0B] border-2 border-solid border-[#1a1a1a] rounded-2xl p-5 md:p-6 mb-4 shadow-lg">

          {/* ─── 1. BIG "📞 Contacter le propriétaire" CTA button (FIRST) ─── */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-4 px-6 bg-[#1a1a1a] hover:bg-black text-white rounded-xl font-bold text-lg md:text-xl transition-colors flex items-center justify-center gap-2 min-h-[56px] shadow-md"
            >
              <Phone className="w-5 h-5" />
              <span>{t('finder.contact_owner_cta')}</span>
            </button>
          )}

          {/* ─── 2 + 3. Form (revealed when CTA clicked): GPS button + form fields ─── */}
          {showForm && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">

              {/* GPS Success/Error indicators + dedicated GPS button REMOVED per refonte-6 brief.
                  GPS is now captured automatically inside the WhatsApp button click (silent fallback to manual location). */}

              {/* ─── Form fields: prénom, téléphone, lieu ─── */}

              {/* First name */}
              <input
                type="text"
                placeholder={t('finder.first_name')}
                value={finderName}
                onChange={(e) => setFinderName(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-[#1a1a1a] rounded-xl text-[#1a1a1a] text-base placeholder:text-[#1a1a1a]/40 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all min-h-[48px]"
              />

              {/* Phone (PhoneInput with dark=false but on yellow bg → white input) */}
              <PhoneInput
                countryCode={finderPhoneCountry}
                onCountryChange={setFinderPhoneCountry}
                value={finderPhone}
                onChange={setFinderPhone}
                placeholder="6 12 34 56 78"
                required
                className="min-h-[48px]"
              />

              {/* Location */}
              <div>
                <input
                  type="text"
                  placeholder={t('finder.location_placeholder')}
                  value={otherLocation}
                  onChange={(e) => setOtherLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-[#1a1a1a] rounded-xl text-[#1a1a1a] text-base placeholder:text-[#1a1a1a]/40 focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:border-transparent transition-all min-h-[48px]"
                />
              </div>

              {/* ─── Contact choice: WhatsApp (GREEN + GPS auto) + Phone (YELLOW) ─── */}
              <div className="pt-1">
                <h3 className="text-[#1a1a1a] text-xs font-bold uppercase tracking-widest text-center mb-2.5">
                  {t('finder.contact_choice')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* WhatsApp Button — GREEN #25D366 + GPS auto-captured on click */}
                  <button
                    onClick={handleWhatsApp}
                    disabled={isLocating || isSubmitting}
                    className="py-3.5 px-4 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-70 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-base min-h-[52px]"
                  >
                    {isLocating ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{t('finder.locating')}</span>
                      </>
                    ) : isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{t('finder.sending')}</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-5 h-5" />
                        {t('finder.by_whatsapp')}
                      </>
                    )}
                  </button>
                  {/* Phone Button — BLACK #1a1a1a + white text (consistent with primary CTA) */}
                  <button
                    onClick={handlePhoneCall}
                    disabled={isLocating || isSubmitting}
                    className="py-3.5 px-4 bg-[#1a1a1a] hover:bg-black disabled:opacity-70 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 text-base min-h-[52px]"
                  >
                    <Phone className="w-5 h-5" />
                    {t('finder.by_phone')}
                  </button>
                </div>
                <p className="text-[#1a1a1a]/70 text-xs text-center mt-2.5 leading-relaxed">
                  {t('finder.gps_auto_shared')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ─── Trust Note ─── */}
        <div className="mt-1 mb-4 text-center text-xs text-white/70 tracking-wide flex items-center justify-center gap-1.5">
          <Shield className="w-4 h-4 inline" />
          <span>{t('finder.trust_note')}</span>
        </div>
      </div>

      {/* AI-FEATURE: Chatbot Widget (Feature #1) — only on active/lost baggage */}
      {baggage && (baggageData?.status === 'active' || baggageData?.status === 'lost') && (
        <ChatbotWidget
          reference={reference}
          baggageContext={{
            destination: baggage.destination || undefined,
            city: otherLocation || undefined,
            agency: baggage.agency || undefined,
            status: baggage.status,
            transportMode: baggage.transportMode || undefined,
          }}
          locale={lang}
          t={t}
          dir={dir}
        />
      )}
    </main>
  );
}
