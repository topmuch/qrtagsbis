'use client'

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Camera,
  FileText,
  Sparkles,
  Globe,
  AlertCircle,
} from 'lucide-react';
import PhoneInput from '@/components/ui/PhoneInput';
import CountryRegionSelect from '@/components/inscrire/CountryRegionSelect';

// TRANSPORT-FEATURE: Import transport utilities
import { useTranslation } from '@/hooks/useTranslation';
import { Language, LANGUAGE_NAMES } from '@/lib/i18n';
import TransportModeSelector from '@/components/inscrire/TransportModeSelector';
import type { TransportMode } from '@/lib/transport';
import {
  TRANSPORT_ICONS,
  TRANSPORT_IMAGES,
  TRANSPORT_FIELDS,
  getTransportImage,
} from '@/lib/transport';

// ─── Brand constants (QRTags palette: blue #10B981 + yellow #F59E0B) ───
const BRAND = '#10B981'; // bleu vif — fonds principaux, headers
const ACCENT = '#F59E0B'; // jaune vif — cards, badges, accents
const INK = '#1a1a1a'; // noir — texte sur jaune, bordures dashed

// ─── Language Selector Component ───
function LanguageSelector({ lang, setLang }: { lang: Language; setLang: (l: Language) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-white border-2 border-black rounded-full text-black hover:bg-black/5 transition-colors text-xs sm:text-sm md:text-base font-medium shadow-sm min-h-[36px] sm:min-h-[40px] md:min-h-[44px]"
      >
        <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
        <span>{LANGUAGE_NAMES[lang]}</span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Language"
          className="absolute top-full right-0 mt-1 sm:mt-2 bg-white border-2 border-black rounded-xl shadow-lg overflow-hidden z-50 min-w-[140px] sm:min-w-[160px]"
        >
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
                lang === l ? 'bg-[#F59E0B] text-black' : 'text-black hover:bg-black/5'
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

// ─── Dashed Encart Helper (bordure noire pointillée) ───
function DashedEncart({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border-2 border-dashed border-black rounded-xl p-4 mb-3 last:mb-0 bg-white/30 ${className}`}>
      {children}
    </div>
  );
}

function InscrireContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrFromUrl = searchParams.get('qr') || '';

  // TRANSPORT-FEATURE: Translation hook + transport mode + step state
  const { t, lang, setLang, dir, countryCode } = useTranslation();
  // ACTIVATION-FLOW: Lire ?mode= depuis l'URL pour pré-sélectionner le mode de transport
  const modeFromUrl = searchParams.get('mode') || '';
  const isModeFromUrl = ['flight', 'train', 'boat', 'bus'].includes(modeFromUrl);
  const [transportMode, setTransportMode] = useState<TransportMode | ''>(
    isModeFromUrl ? (modeFromUrl as TransportMode) : ''
  );
  const [step, setStep] = useState(isModeFromUrl ? 2 : 1);
  const [activeTab, setActiveTab] = useState<'manual' | 'scan'>('manual');

  const [loading, setLoading] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState(countryCode);
  const [formData, setFormData] = useState({
    reference: qrFromUrl.toUpperCase(), // caché UI, conservé pour l'API
    firstName: '',
    lastName: '',
    destination: '',
    departureDate: '',
    departureTime: '',
    whatsapp: '',
    // TRANSPORT-FEATURE: Conditional fields (all modes)
    airlineName: '',
    flightNumber: '',
    trainCompany: '',
    trainNumber: '',
    shipName: '',
    shipCabin: '',
    busCompany: '',
    busLineNumber: '',
  });

  // Sync phoneCountry when countryCode is detected
  useEffect(() => {
    if ((countryCode && countryCode !== 'FR') || !phoneCountry) {
      setPhoneCountry(countryCode);
    }
  }, [countryCode]);

  // TRANSPORT-FEATURE: Get dynamic fields for current transport mode
  const currentFields = transportMode ? TRANSPORT_FIELDS[transportMode] : [];

  // TRANSPORT-FEATURE: Handle transport mode selection → advance to step 2
  const handleModeSelect = (mode: TransportMode) => {
    setTransportMode(mode);
    setStep(2);
  };

  const handleBackToMode = () => {
    setStep(1);
  };

  // 🔒 Référence absente → activation impossible
  const missingReference = !formData.reference;

  const doSubmit = async () => {
    if (!transportMode || missingReference) return;
    setLoading(true);

    try {
      const response = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: formData.reference,
          travelerFirstName: formData.firstName,
          travelerLastName: formData.lastName,
          whatsappOwner: formData.whatsapp,
          transportMode: transportMode,
          airlineName: formData.airlineName,
          flightNumber: formData.flightNumber,
          trainCompany: formData.trainCompany,
          trainNumber: formData.trainNumber,
          shipName: formData.shipName,
          shipCabin: formData.shipCabin,
          busCompany: formData.busCompany,
          busLineNumber: formData.busLineNumber,
          destination: formData.destination,
          departureDate: formData.departureDate || undefined,
          departureTime: formData.departureTime || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem(
          'activationData',
          JSON.stringify({
            reference: formData.reference,
            firstName: formData.firstName,
            lastName: formData.lastName,
            whatsapp: formData.whatsapp,
            destination: formData.destination,
            transportMode: transportMode,
            airlineName: formData.airlineName,
            flightNumber: formData.flightNumber,
            trainCompany: formData.trainCompany,
            trainNumber: formData.trainNumber,
            shipName: formData.shipName,
            shipCabin: formData.shipCabin,
            busCompany: formData.busCompany,
            busLineNumber: formData.busLineNumber,
            type: 'voyageur',
            activatedAt: new Date().toISOString(),
            expiresAt: data.baggage?.expiresAt,
          })
        );
        router.push('/success?type=voyageur');
      } else {
        const error = await response.json();
        alert(error.message || t('inscrire.error_activation'));
      }
    } catch (error) {
      console.error('Activation error:', error);
      alert(t('inscrire.error_activation'));
    } finally {
      setLoading(false);
    }
  };

  // TRANSPORT_ICON: Utilise la vraie image PNG si un mode est sélectionné, sinon emoji fallback.
  const TransportIcon = transportMode ? TRANSPORT_ICONS[transportMode] : '✈️';
  const TransportImageSrc = transportMode ? getTransportImage(transportMode) : null;

  return (
    <main
      className="min-h-[100dvh] min-h-screen bg-[#10B981] flex flex-col px-4 sm:px-5 md:px-8 pb-[env(safe-area-inset-bottom,0px)]"
      dir={dir}
    >
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 flex items-center justify-between pt-[env(safe-area-inset-top,0px)] px-0 py-2 sm:py-3 md:py-4 bg-[#10B981]">
        <Link
          href="/"
          className="flex items-center gap-2 text-white hover:text-[#F59E0B] transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm md:text-base font-medium">{t('inscrire.back')}</span>
        </Link>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="QRTags" className="h-16 w-auto object-contain" />
        </div>
        <LanguageSelector lang={lang} setLang={setLang} />
      </header>

      {/* ─── Container ─── */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col py-4 sm:py-6 md:py-0">
        {/* ═══ BADGE DE STATUT ═══ */}
        <div className="mt-2 sm:mt-4 md:mt-6 mb-4 sm:mb-6 text-center">
          <span
            className="inline-flex items-center justify-center px-6 py-3 rounded-full font-bold text-lg shadow-lg text-black"
            style={{ backgroundColor: ACCENT, boxShadow: `0 10px 25px ${INK}40` }}
          >
            {qrFromUrl ? `✨ ${t('inscrire.voyageur_badge')}` : `🧳 ${t('inscrire.title')}`}
          </span>
          <p className="mt-3 text-white text-base md:text-lg leading-relaxed max-w-md mx-auto">
            {qrFromUrl ? t('inscrire.welcome_desc') : t('inscrire.subtitle')}
          </p>
        </div>

        {/* ─── Status Indicator ─── */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT }} />
          <span className="text-sm font-bold uppercase tracking-widest text-white">
            {step === 1 ? t('transport.select_mode') : t('inscrire.step_2_subtitle')}
          </span>
        </div>

        {/* ═══ BLOC PRINCIPAL — Formulaire Activation (jaune QRTags) ═══ */}
        <div
          className="w-full rounded-2xl p-5 md:p-6 mb-5 shadow-xl"
          style={{ backgroundColor: ACCENT, boxShadow: `0 20px 40px ${INK}15` }}
        >
          {/* ─── Step 1: Transport Mode Selector ─── */}
          {step === 1 && (
            <>
              <h2 className="text-xs uppercase tracking-widest text-black font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: INK }} />
                {t('transport.select_mode')}
              </h2>

              {/* Tab Toggle — Manual / Scan (selected = blanc) */}
              <div className="flex gap-2 mb-5">
                <button
                  onClick={() => setActiveTab('manual')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all min-h-[44px] border-2 border-black ${
                    activeTab === 'manual'
                      ? 'bg-white text-black shadow-lg'
                      : 'bg-white/40 text-black hover:bg-white/60'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  {t('inscrire.manual_tab')}
                </button>
                <button
                  onClick={() => setActiveTab('scan')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all min-h-[44px] border-2 border-black ${
                    activeTab === 'scan'
                      ? 'bg-white text-black shadow-lg'
                      : 'bg-white/40 text-black hover:bg-white/60'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  {t('inscrire.scan_tab')}
                </button>
              </div>

              {activeTab === 'scan' ? (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-white/40 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-black">
                    <Camera className="w-10 h-10 text-black/60" />
                  </div>
                  <h3 className="text-black font-semibold text-lg mb-2">{t('inscrire.scan_title')}</h3>
                  <p className="text-black/70 text-sm mb-5">{t('inscrire.scan_desc')}</p>
                  <button className="w-full py-4 px-6 bg-black hover:bg-black/80 text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 min-h-[56px] shadow-lg">
                    <Camera className="w-5 h-5" />
                    {t('inscrire.scan_button')}
                  </button>
                </div>
              ) : (
                <>
                  <TransportModeSelector
                    selectedMode={transportMode}
                    onSelect={handleModeSelect}
                    t={t}
                    lang={lang}
                  />
                  <button
                    type="button"
                    disabled={!transportMode}
                    onClick={() => transportMode && setStep(2)}
                    className="w-full mt-5 py-4 px-6 bg-black hover:bg-black/80 disabled:bg-black/30 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 min-h-[56px] shadow-lg"
                  >
                    {t('inscrire.next_step')}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </>
          )}

          {/* ─── Step 2: Activation Form ─── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Back button */}
              <button
                type="button"
                onClick={handleBackToMode}
                className="flex items-center gap-1.5 text-black/70 hover:text-black transition-colors text-sm mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('inscrire.back_step')}
              </button>

              {/* Mode indicator — vraie image au lieu d'emoji */}
              <DashedEncart>
                <div className="flex items-center gap-3">
                  {TransportImageSrc ? (
                    <div className="w-10 h-10 flex-shrink-0">
                      <Image
                        src={TransportImageSrc}
                        alt={t(`transport.mode_${transportMode}`)}
                        width={40}
                        height={40}
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    </div>
                  ) : (
                    <span className="text-2xl">{TransportIcon}</span>
                  )}
                  <div>
                    <p className="text-sm text-black/70 font-medium">{t('common.baggage_type')}</p>
                    <p className="text-lg font-bold text-black">{t(`transport.mode_${transportMode}`)}</p>
                  </div>
                </div>
              </DashedEncart>

              <h2 className="text-xs uppercase tracking-widest text-black font-bold flex items-center gap-2">
                {TransportImageSrc ? (
                  <div className="w-4 h-4 flex-shrink-0">
                    <Image
                      src={TransportImageSrc}
                      alt=""
                      width={16}
                      height={16}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </div>
                ) : (
                  <span>{TransportIcon}</span>
                )}
                {t('transport.traveler_info')}
              </h2>

              {/* 🔒 Référence absente — warning + bouton désactivé */}
              {missingReference && (
                <div className="border-2 border-dashed border-black bg-white/60 rounded-xl p-4 mb-3 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-black">
                    <p className="font-bold mb-1">⚠️ Aucun code QR détecté</p>
                    <p className="text-black/70">
                      Scannez le QR code collé sur votre objet pour activer votre protection. Si vous
                      n&apos;avez pas encore de QR,{' '}
                      <Link href="/#pricing" className="underline font-bold text-black">
                        commandez un autocollant
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              )}

              {/* Name Fields — Dashed Encart */}
              <DashedEncart>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-black/80 font-medium mb-1.5">
                      {t('inscrire.first_name_label')}
                    </p>
                    <input
                      type="text"
                      placeholder={t('inscrire.first_name_placeholder')}
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full bg-white border-2 border-black text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black focus:border-black rounded-lg px-3 py-2.5 text-base min-h-[48px]"
                      required
                    />
                  </div>
                  <div>
                    <p className="text-sm text-black/80 font-medium mb-1.5">
                      {t('inscrire.last_name_label')}
                    </p>
                    <input
                      type="text"
                      placeholder={t('inscrire.last_name_placeholder')}
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full bg-white border-2 border-black text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black focus:border-black rounded-lg px-3 py-2.5 text-base min-h-[48px]"
                      required
                    />
                  </div>
                </div>
              </DashedEncart>

              {/* TRANSPORT-FEATURE: Dynamic conditional fields */}
              {currentFields.length > 0 && (
                <DashedEncart>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentFields.map((field) => (
                      <div key={field.key}>
                        <p className="text-sm text-black/80 font-medium mb-1.5">{t(field.labelKey)}</p>
                        <input
                          type="text"
                          placeholder={t(field.placeholderKey)}
                          value={(formData as Record<string, string>)[field.key] || ''}
                          onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                          className="w-full bg-white border-2 border-black text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black focus:border-black rounded-lg px-3 py-2.5 text-base min-h-[48px]"
                        />
                      </div>
                    ))}
                  </div>
                </DashedEncart>
              )}

              {/* Destination — Dashed Encart + dropdown pays par régions */}
              <DashedEncart>
                <div className="flex items-center gap-3">
                  <span className="text-xl">📍</span>
                  <div className="flex-1">
                    <p className="text-sm text-black/80 font-medium mb-1.5">
                      {t('inscrire.destination_label')}
                    </p>
                    <CountryRegionSelect
                      value={formData.destination}
                      onChange={(v) => setFormData({ ...formData, destination: v })}
                      placeholder="Sélectionnez votre destination"
                    />
                  </div>
                </div>
              </DashedEncart>

              {/* Departure Date & Time — Dashed Encart */}
              <DashedEncart>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">📅</span>
                  <p className="text-sm text-black/80 font-medium">{t('transport.common_departure_date')}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    className="w-full bg-white border-2 border-black text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-black rounded-lg px-3 py-2.5 text-base min-h-[48px]"
                  />
                  <input
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                    className="w-full bg-white border-2 border-black text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-black rounded-lg px-3 py-2.5 text-base min-h-[48px]"
                  />
                </div>
              </DashedEncart>

              {/* WhatsApp — Dashed Encart */}
              <DashedEncart className="mb-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📱</span>
                  <div className="flex-1">
                    <PhoneInput
                      countryCode={phoneCountry}
                      onCountryChange={setPhoneCountry}
                      value={formData.whatsapp}
                      onChange={(fullNumber) => setFormData({ ...formData, whatsapp: fullNumber })}
                      placeholder="6 12 34 56 78"
                      required
                      label={t('inscrire.whatsapp_label')}
                      hint={t('inscrire.whatsapp_hint')}
                    />
                  </div>
                </div>
              </DashedEncart>
            </div>
          )}
        </div>

        {/* ═══ BOUTON SUBMIT (noir) ═══ */}
        {step === 2 && (
          <div className="mb-6">
            <button
              onClick={doSubmit}
              disabled={loading || !transportMode || missingReference}
              className="w-full py-4 px-6 bg-black hover:bg-black/80 active:bg-black/90 disabled:bg-black/30 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl shadow-lg transition-all duration-200 transform hover:-translate-y-1 min-h-[56px] focus:ring-2 focus:ring-black focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('inscrire.submit_loading')}
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  {t('inscrire.submit')}
                </span>
              )}
            </button>
          </div>
        )}

        {/* ─── Help Section ─── */}
        <div className="text-center pb-6">
          <p className="text-white/80 text-sm">
            {t('inscrire.no_qr')}{' '}
            <Link href="/#pricing" className="font-bold underline" style={{ color: ACCENT }}>
              {t('inscrire.order_sticker')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function InscrirePage() {
  const { t } = useTranslation();

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#10B981] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-white/20 border-t-[#F59E0B] rounded-full mx-auto mb-4" />
            <p className="text-lg text-white">{t('common.loading')}</p>
          </div>
        </main>
      }
    >
      <InscrireContent />
    </Suspense>
  );
}
