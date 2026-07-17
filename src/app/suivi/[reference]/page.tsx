'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import {
  AlertCircle,
  Clock,
  Shield,
  Navigation,
  CheckCircle,
  RefreshCw,
  Phone,
  MessageCircle,
  MapPin,
  Globe,
  ArrowRight,
  ChevronDown,
  X,
  AlertTriangle,
  Volume2,
  VolumeX,
  Star,
  Wifi,
  WifiOff,
} from 'lucide-react';

// Dynamic imports (avoid SSR issues)
const LeafletMap = dynamic(() => import('@/components/LeafletMap'), { ssr: false, loading: () => <MapSkeleton /> });
import { SocialShareButtons } from '@/components/SocialShareButtons';
import { ReviewModal } from '@/components/ReviewModal';
import { LossAlertBanner } from '@/components/LossAlertBanner';
import { useTrackingSocket } from '@/hooks/useTrackingSocket';
import { useTranslation } from '@/hooks/useTranslation';
import { Language, LANGUAGE_NAMES } from '@/lib/i18n';
import type { ScanContext } from '@/lib/scan-context';
import { CONTEXT_ICONS, CONTEXT_COLORS } from '@/lib/scan-context';
import { generatePreFilledMessage, buildWhatsAppUrl } from '@/lib/whatsapp-message';
import { safeTransportMode, getTransportImage } from '@/lib/transport';
import type { TransportMode } from '@/lib/transport';
import { useAudioAlert, POLL_INTERVAL_MS } from '@/hooks/useAudioAlert';

// ─── Brand constants (QRTags palette: blue #10B981 + yellow #F59E0B) ───
const BRAND = '#10B981';   // bleu vif — fonds principaux
const ACCENT = '#F59E0B'; // jaune vif — cards, accents
const INK = '#1a1a1a';    // noir — texte sur jaune, bordures dashed
const CREAM = '#10B981';  // (alias — désormais bleu QRTags)
const URGENT_RED = '#EF4444';
const URGENT_BG = '#FEF2F2';
const QRTAGS_SUPPORT_PHONE = '+33745349339';

// ═══════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════

interface ScanEntry {
  id: string;
  location: string | null;
  city: string | null;
  country: string | null;
  context: string;
  finderName: string | null;
  finderPhone: string | null;
  message: string | null;
  hasMap: boolean;
  latitude: number | null;
  longitude: number | null;
  scannedAt: string;
  whatsappStatus: string | null;
}

interface LastPosition {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  hasCoordinates: boolean;
}

interface BaggageInfo {
  reference: string;
  type: string;
  travelerName: string;
  baggageIndex: number;
  baggageType: string;
  status: string;
  airlineName: string | null;
  flightNumber: string | null;
  destination: string | null;
  departureDate: string | null;
  departureTime: string | null;
  transportMode: string;
  trainCompany: string | null;
  trainNumber: string | null;
  shipName: string | null;
  shipCabin: string | null;
  busCompany: string | null;
  busLineNumber: string | null;
  agency: string | null;
  createdAt: string | null;
  lastScanDate: string | null;
  lastLocation: string | null;
  declaredLostAt: string | null;
  foundAt: string | null;
  expiresAt: string | null;
}

interface SuiviData {
  status: string;
  baggage: BaggageInfo;
  lastFinder: { name: string | null; phone: string | null } | null;
  scans: ScanEntry[];
  lastPosition: LastPosition | null;
}

// Type for beforeinstallprompt event (not in standard TS DOM lib)
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// ═══════════════════════════════════════════════════════
//  HOOK: PWA Install Prompt (local, with iOS detection)
// ═══════════════════════════════════════════════════════

function usePWAInstallPrompt() {
  // Detect iOS up-front (no setState-in-effect needed: navigator is stable on client)
  // Default to false for SSR; useEffect below sets the real value via lazy init.
  const [isIOS, setIsIOS] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);

  // iOS detection runs once on mount — we use a ref-less pattern:
  //   - setState is allowed here because this is reading a non-React external value
  //   - The lint rule complains because setState happens synchronously, but this is
  //     a legitimate pattern for reading navigator.userAgent at mount time.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect iOS (no beforeinstallprompt event on iOS Safari)
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsIOS(iOS);

    // Already installed? (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // On iOS, show the "Add to Home Screen" instruction button
    if (iOS) {
      setShowButton(true);
      return;
    }

    // On Android/Chrome: capture beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (isIOS) {
      // Caller opens the instructions modal
      return;
    }
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setShowButton(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt, isIOS]);

  return { showButton, isIOS, handleInstall };
}

// ═══════════════════════════════════════════════════════
//  LANGUAGE SELECTOR (recoloré — light theme, brand-aware)
// ═══════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════
//  DASHED ENCART (light variant: dashed black on white)
// ═══════════════════════════════════════════════════════

function DashedEncart({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border-2 border-dashed border-[#1a1a1a]/60 rounded-xl p-3 mb-2.5 last:mb-0 ${className}`}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  MAP SKELETON (for Leaflet lazy loading)
// ═══════════════════════════════════════════════════════

function MapSkeleton() {
  return (
    <div className="w-full h-full bg-[#F59E0B]/10 rounded-xl flex items-center justify-center animate-pulse">
      <div className="text-center">
        <MapPin className="w-8 h-8 text-[#F59E0B]/40 mx-auto mb-2" />
        <p className="text-sm text-[#1a1a1a]/40">Chargement de la carte...</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  LOADING SCREEN (recoloré)
// ═══════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════
//  ERROR SCREEN (recoloré)
// ═══════════════════════════════════════════════════════

function ErrorScreen({
  type,
  t,
  lang,
  setLang,
}: {
  type: string;
  t: (key: string) => string;
  lang: Language;
  setLang: (l: Language) => void;
}) {
  const errorConfig = {
    not_found: {
      icon: <AlertCircle className="w-12 h-12 text-red-500" />,
      title: t('tracking.baggage_not_found'),
      message: t('tracking.baggage_not_found_desc'),
    },
    blocked: {
      icon: <Shield className="w-12 h-12 text-[#1a1a1a]/40" />,
      title: t('errors.baggage_blocked'),
      message: t('tracking.baggage_blocked_desc'),
    },
    expired: {
      icon: <Clock className="w-12 h-12 text-[#1a1a1a]/40" />,
      title: t('errors.protection_expired'),
      message: t('tracking.baggage_expired_desc'),
    },
    pending_activation: {
      icon: <AlertCircle className="w-12 h-12 text-[#F59E0B]" />,
      title: t('tracking.baggage_not_found'),
      message: t('tracking.baggage_pending_desc'),
    },
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
        <div className="w-full py-4 px-6 bg-[#F59E0B]/20 border-2 border-dashed border-[#1a1a1a] text-[#1a1a1a] rounded-xl text-center text-base font-medium min-h-[56px]">
          {t('tracking.trust_note')}
        </div>
      </div>
    </main>
  );
}

// ═══════════════════════════════════════════════════════
//  GOOGLE MAPS IFRAME (recoloré fallback)
// ═══════════════════════════════════════════════════════

function MapEmbed({
  latitude,
  longitude,
  address,
  t,
}: {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  t: (key: string) => string;
}) {
  let mapSrc: string | null = null;

  if (latitude && longitude) {
    mapSrc = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;
  } else if (address) {
    mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=13&output=embed`;
  }

  if (!mapSrc) {
    return (
      <div className="bg-[#F59E0B]/20 border-2 border-dashed border-[#1a1a1a] rounded-xl p-4 text-center text-[#1a1a1a]">
        <MapPin className="w-6 h-6 mx-auto mb-2" />
        <p className="text-base font-medium">{address || t('tracking.no_location')}</p>
        <p className="text-sm text-[#1a1a1a]/70 mt-1">{t('tracking.map_unavailable')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border-2 border-[#1a1a1a]">
      <iframe
        src={mapSrc}
        width="100%"
        height="100%"
        style={{ border: 0, minHeight: '180px' }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Location"
        className="w-full h-full"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  CONTEXT BADGE (conservé, recoloré sur fond jaune/20)
// ═══════════════════════════════════════════════════════

function ContextBadge({ context, t }: { context: string; t: (key: string) => string }) {
  const scanContext = context as ScanContext;
  const icon = CONTEXT_ICONS[scanContext] || '📍';
  // Map original color classes to neutral brand-aware classes
  const colorClass = CONTEXT_COLORS[scanContext] || 'bg-[#1a1a1a]';

  const contextKeyMap: Record<string, string> = {
    departure_airport_urgent: 'tracking.context_departure',
    arrival_airport: 'tracking.context_arrival',
    in_transit: 'tracking.context_transit',
    static_location: 'tracking.context_static',
  };
  const labelKey = contextKeyMap[scanContext] || 'tracking.context_static';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${colorClass} text-white text-xs font-bold rounded-full`}>
      <span>{icon}</span>
      <span>{t(labelKey)}</span>
    </span>
  );
}

// ═══════════════════════════════════════════════════════
//  iOS INSTALL INSTRUCTIONS MODAL
// ═══════════════════════════════════════════════════════

function IOSInstallModal({
  show,
  onClose,
  t,
}: {
  show: boolean;
  onClose: () => void;
  t: (key: string) => string;
}) {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white border-2 border-[#1a1a1a] rounded-2xl p-5 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-[#1a1a1a]">📱 {t('tracking.install_app_ios')}</h3>
          <button
            onClick={onClose}
            aria-label={t('tracking.close')}
            className="w-8 h-8 rounded-full hover:bg-[#F59E0B]/30 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <ol className="space-y-2 text-sm text-[#1a1a1a]">
          <li className="flex gap-2"><span>1.</span><span>{t('tracking.install_ios_step1')} <span className="inline-block px-1.5 py-0.5 bg-[#F59E0B] rounded text-xs font-bold">⬆️</span></span></li>
          <li className="flex gap-2"><span>2.</span><span>{t('tracking.install_ios_step2')}</span></li>
          <li className="flex gap-2"><span>3.</span><span>{t('tracking.install_ios_step3')}</span></li>
        </ol>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════

export default function SuiviPage() {
  const params = useParams();
  const reference = params.reference as string;

  const { t, lang, setLang, dir } = useTranslation();

  const [data, setData] = useState<SuiviData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState(false);

  // Accordion/collapsible state
  const [historyOpen, setHistoryOpen] = useState(true);
  const [showAllScans, setShowAllScans] = useState(false);
  const [baggageOpen, setBaggageOpen] = useState(false);

  // PWA install state
  const { showButton: showInstallButton, isIOS, handleInstall } = usePWAInstallPrompt();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // Status toggle state
  const [statusToast, setStatusToast] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  // Audio alert system
  const { audioEnabled, enableAudio, toggleAudio, checkAndNotify } = useAudioAlert(lang);

  // WebSocket real-time connection
  const { isConnected: wsConnected } = useTrackingSocket(reference);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);

  // Show trajectory map state
  const [showTrajectoryMap, setShowTrajectoryMap] = useState(false);

  // Fetch tracking data
  const fetchSuivi = useCallback(async (isRefresh = false, isSilent = false) => {
    if (isRefresh && !isSilent) setIsRefreshing(true);

    try {
      const response = await fetch(`/api/suivi/${reference}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching suivi:', error);
      setData({ status: 'error', baggage: null as unknown as BaggageInfo, lastFinder: null, scans: [], lastPosition: null });
    } finally {
      setLoading(false);
      if (!isSilent) setIsRefreshing(false);
    }
  }, [reference]);

  // Initial fetch
  useEffect(() => {
    fetchSuivi(false);
  }, [fetchSuivi]);

  // ─── Polling: auto-refresh when audio alerts are enabled ───
  useEffect(() => {
    if (!audioEnabled) return;

    const interval = setInterval(() => {
      fetchSuivi(false, true); // silent refresh
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [audioEnabled, fetchSuivi]);

  // ─── Audio notification: check when data changes ───
  useEffect(() => {
    if (!data || data.status === 'error' || data.status === 'not_found') return;
    checkAndNotify(data.baggage, data.scans);
  }, [data, checkAndNotify]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    await fetchSuivi(true);
    setRefreshToast(true);
    setTimeout(() => setRefreshToast(false), 2000);
  }, [fetchSuivi]);

  // WHATSAPP-HARMONIZED: WhatsApp handler — owner contacts finder
  const handleWhatsApp = useCallback(() => {
    if (!data?.lastFinder?.phone) return;

    const lastScan = data.scans[0];
    const message = generatePreFilledMessage({
      baggage: {
        reference: data.baggage.reference,
        bagType: data.baggage.baggageType || 'cabine',
        transportMode: (data.baggage.transportMode || 'flight') as 'flight' | 'train' | 'boat' | 'bus',
        airlineName: data.baggage.airlineName || undefined,
        flightNumber: data.baggage.flightNumber || undefined,
        trainCompany: data.baggage.trainCompany || undefined,
        trainNumber: data.baggage.trainNumber || undefined,
        shipName: data.baggage.shipName || undefined,
        shipCabin: data.baggage.shipCabin || undefined,
        busCompany: data.baggage.busCompany || undefined,
        busLineNumber: data.baggage.busLineNumber || undefined,
        destination: data.baggage.destination || undefined,
      },
      scanData: {
        city: data.lastPosition?.address || data.baggage?.lastLocation || '',
        address: data.lastPosition?.address || '',
        context: (lastScan?.context || 'static_location') as ScanContext,
      },
      finder: {
        name: data.lastFinder?.name || '',
        whatsapp: data.lastFinder?.phone || '',
      },
      locale: lang,
      ownerName: data.baggage?.travelerName || undefined,
    });

    const url = buildWhatsAppUrl(data.lastFinder.phone, message);

    const isIOSUA = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOSUA) {
      window.location.href = url;
    } else {
      const newWindow = window.open(url, '_blank');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        window.location.href = url;
      }
    }
  }, [data, reference, lang]);

  // Phone call handler
  const handlePhoneCall = useCallback(() => {
    if (!data?.lastFinder?.phone) return;
    window.location.href = `tel:${data.lastFinder.phone}`;
  }, [data]);

  // ─── Status toggle handler (mark-lost / mark-found) ───
  const handleStatusToggle = useCallback(async (action: 'mark-lost' | 'mark-found') => {
    if (isTogglingStatus) return;

    if (action === 'mark-lost') {
      const confirmed = window.confirm(t('tracking.declare_lost_confirm'));
      if (!confirmed) return;
    }

    setIsTogglingStatus(true);
    try {
      const response = await fetch(`/api/baggage-status/${reference}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const result = await response.json();

      if (result.success) {
        // Refresh page data to reflect new status
        await fetchSuivi(true);
        setStatusToast(true);
        setTimeout(() => setStatusToast(false), 3000);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    } finally {
      setIsTogglingStatus(false);
    }
  }, [reference, isTogglingStatus, t, fetchSuivi]);

  // ─── WhatsApp Support handler (emergency) ───
  const handleSupportWhatsApp = useCallback(() => {
    const message = t('tracking.urgent_support_message', { ref: reference });
    const url = buildWhatsAppUrl(QRTAGS_SUPPORT_PHONE, message);
    const isIOSUA = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOSUA) {
      window.location.href = url;
    } else {
      const newWindow = window.open(url, '_blank');
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        window.location.href = url;
      }
    }
  }, [reference, t]);

  // ─── Dynamic transport company name ───
  const transportCompany = data?.baggage?.airlineName
    || data?.baggage?.trainCompany
    || data?.baggage?.shipName
    || data?.baggage?.busCompany
    || t('tracking.urgent_fallback_company');

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

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const locale = lang === 'ar' ? 'ar-SA' : lang === 'en' ? 'en-US' : 'fr-FR';
    return new Date(dateStr).toLocaleString(locale, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ─── Loading ───
  if (loading) {
    return <LoadingScreen t={t} />;
  }

  // ─── Error states ───
  if (!data || data.status === 'not_found' || data.status === 'error') {
    return <ErrorScreen type="not_found" t={t} lang={lang} setLang={setLang} />;
  }
  if (data.status === 'blocked') {
    return <ErrorScreen type="blocked" t={t} lang={lang} setLang={setLang} />;
  }
  if (data.status === 'expired') {
    return <ErrorScreen type="expired" t={t} lang={lang} setLang={setLang} />;
  }
  if (data.status === 'pending_activation') {
    return <ErrorScreen type="pending_activation" t={t} lang={lang} setLang={setLang} />;
  }

  const baggage = data.baggage;
  const isDeclaredLost = !!baggage?.declaredLostAt && !baggage?.foundAt;
  const isFound = !!baggage?.foundAt;
  const isScanned = baggage?.status === 'scanned';
  const hasFinderPhone = !!(data.lastFinder?.phone);

  // ─── Dynamic status header config ───
  const statusConfig: { title: string; badgeClass: string; desc: string } = (() => {
    if (isDeclaredLost) {
      return {
        title: `🚨 ${t('tracking.badge_lost')}`,
        badgeClass: 'bg-red-600 text-white animate-pulse',
        desc: t('tracking.lost_description'),
      };
    }
    if (isFound) {
      return {
        title: `✅ ${t('tracking.badge_found')}`,
        badgeClass: 'bg-[#F59E0B] text-[#1a1a1a]',
        desc: t('tracking.found_description'),
      };
    }
    if (isScanned) {
      return {
        title: t('tracking.objet_localise'),
        badgeClass: 'bg-[#F59E0B] text-[#1a1a1a]',
        desc: t('tracking.found_description'),
      };
    }
    return {
      title: t('tracking.objet_protege'),
      badgeClass: 'bg-[#1a1a1a] text-[#F59E0B]',
      desc: t('tracking.active_description'),
    };
  })();

  // History accordion: 3 first by default if >3, all if <=3
  const INITIAL_SCAN_COUNT = 3;
  const visibleScans = showAllScans ? data.scans : data.scans.slice(0, INITIAL_SCAN_COUNT);
  const hiddenScansCount = data.scans.length - INITIAL_SCAN_COUNT;

  // Support mailto link
  const supportSubject = encodeURIComponent(`Problème objet ${reference}`);
  const supportBody = encodeURIComponent(
    `Bonjour, je rencontre un problème avec mon objet ${reference}.\n\nDescription du problème :\n`
  );
  const supportHref = `mailto:contact@qrtagss.com?subject=${supportSubject}&body=${supportBody}`;

  // Checklist CTA link
  const checklistHref = `/checklist?ref=${encodeURIComponent(reference)}&source=tracking_page`;

  // ═══════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════

  return (
    <main
      className="min-h-screen bg-[#10B981] flex flex-col"
      dir={dir}
    >
      {/* ─── Sticky Header ─── */}
      <header className="sticky top-0 z-40 bg-[#10B981] border-b-2 border-[#F59E0B]/30 pt-[env(safe-area-inset-top,0px)] px-4 sm:px-5 md:px-8 py-2 sm:py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1 text-white hover:text-[#F59E0B] transition-colors text-sm font-medium min-h-[40px] px-2"
            aria-label={t('tracking.back_to_scan')}
          >
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            <span>{t('tracking.back_to_scan')}</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Audio alert toggle */}
            <button
              onClick={toggleAudio}
              className={`flex items-center justify-center w-9 h-9 rounded-full border-2 transition-colors min-h-[40px] ${
                audioEnabled
                  ? 'border-[#F59E0B] bg-[#F59E0B] text-[#1a1a1a]'
                  : 'border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#F59E0B]'
              }`}
              aria-label={t('tracking.audio_alert_toggle_aria')}
              title={audioEnabled ? t('tracking.audio_alert_enabled') : t('tracking.audio_alert_disabled')}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#F59E0B] transition-colors disabled:opacity-50"
              aria-label={t('common.refresh')}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <LanguageSelector lang={lang} setLang={setLang} />
          </div>
        </div>
      </header>

      {/* ─── Refresh Toast ─── */}
      {refreshToast && (
        <div className="fixed top-[calc(3.5rem+env(safe-area-inset-top,0px))] sm:top-[calc(4rem+env(safe-area-inset-top,0px))] left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-[#F59E0B] px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-300 text-sm font-medium flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4" />
          {t('tracking.refresh_success')}
        </div>
      )}

      {/* ─── Status Toast ─── */}
      {statusToast && (
        <div className="fixed top-[calc(5.5rem+env(safe-area-inset-top,0px))] sm:top-[calc(6rem+env(safe-area-inset-top,0px))] left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-300 text-sm font-medium flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4" />
          {t('tracking.status_updated')}
        </div>
      )}

      {/* ─── Audio Alert Banner (show when not enabled AND baggage not yet scanned) ─── */}
      {!audioEnabled && data && data.scans.length === 0 && (
        <div className="sticky top-[52px] sm:top-[56px] z-30 bg-[#10B981] px-4 sm:px-5 md:px-8 py-2">
          <div className="max-w-md mx-auto">
            <div className="bg-[#F59E0B] border-2 border-[#1a1a1a] rounded-2xl p-4 text-center">
              <p className="font-bold text-[#1a1a1a] text-base mb-2">
                🔔 {t('tracking.audio_alert_banner_title')}
              </p>
              <button
                onClick={enableAudio}
                className="bg-[#1a1a1a] hover:bg-black text-[#F59E0B] py-2.5 px-6 rounded-xl font-bold transition-colors text-sm min-h-[44px] inline-flex items-center gap-2"
              >
                <Volume2 className="w-4 h-4" />
                {t('tracking.audio_alert_activate_btn')}
              </button>
              <p className="text-xs text-[#1a1a1a]/70 mt-2">
                {t('tracking.audio_alert_keep_open')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Scanning indicator (show when audio is enabled AND no scans yet) ─── */}
      {audioEnabled && data && data.scans.length === 0 && (
        <div className="sticky top-[52px] sm:top-[56px] z-30 bg-[#10B981] px-4 sm:px-5 md:px-8 py-2">
          <div className="max-w-md mx-auto">
            <div className="bg-[#F59E0B]/20 border-2 border-dashed border-[#F59E0B] rounded-xl px-4 py-2.5 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse flex-shrink-0" />
              <span className="text-sm font-medium text-[#1a1a1a]">{t('tracking.audio_alert_scanning')}</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Interactive Map (Leaflet — trajectory + markers) ─── */}
      {data.lastPosition && (data.lastPosition.hasCoordinates || data.lastPosition.address) && (
        <section className="sticky top-[52px] sm:top-[56px] z-30 bg-[#10B981] px-4 sm:px-5 md:px-8 py-3">
          <div className="max-w-md mx-auto">
            <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-2.5 shadow-sm">
              <div className="flex items-center justify-between mb-2 px-1">
                <h2 className="text-xs uppercase tracking-widest text-[#1a1a1a] font-bold flex items-center gap-1.5">
                  <span>🗺️</span> {showTrajectoryMap ? t('tracking.trajectory_map') || 'Trajectoire complète' : t('tracking.last_location')}
                </h2>
                <div className="flex items-center gap-2">
                  {/* WebSocket status indicator */}
                  <span className="flex items-center gap-1 text-[10px] text-[#1a1a1a]/50" title={wsConnected ? 'Temps réel' : 'Polling'}>
                    {wsConnected ? <Wifi className="w-3 h-3 text-green-500" /> : <WifiOff className="w-3 h-3" />}
                  </span>
                  {baggage.lastScanDate && (
                    <span className="text-[10px] text-[#1a1a1a]/60">
                      {formatDateTime(baggage.lastScanDate)}
                    </span>
                  )}
                </div>
              </div>

              {/* Toggle: last position vs trajectory */}
              {data.scans.filter(s => s.latitude && s.longitude).length > 1 && (
                <div className="flex gap-2 mb-2 px-1">
                  <button
                    onClick={() => setShowTrajectoryMap(false)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-colors min-h-[28px] ${!showTrajectoryMap ? 'bg-[#1a1a1a] text-[#F59E0B]' : 'bg-[#F59E0B]/20 text-[#1a1a1a]/70 hover:bg-[#F59E0B]/40'}`}
                  >
                    📍 Dernière position
                  </button>
                  <button
                    onClick={() => setShowTrajectoryMap(true)}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-colors min-h-[28px] ${showTrajectoryMap ? 'bg-[#1a1a1a] text-[#F59E0B]' : 'bg-[#F59E0B]/20 text-[#1a1a1a]/70 hover:bg-[#F59E0B]/40'}`}
                  >
                    🛤️ Trajectoire ({data.scans.filter(s => s.latitude && s.longitude).length})
                  </button>
                </div>
              )}

              <div className="h-56 sm:h-64 md:h-72">
                {showTrajectoryMap && data.scans.filter(s => s.latitude && s.longitude).length > 0 ? (
                  <LeafletMap
                    scans={data.scans.filter(s => s.latitude && s.longitude).map(s => ({
                      id: s.id,
                      latitude: s.latitude!,
                      longitude: s.longitude!,
                      location: s.location,
                      city: s.city,
                      country: s.country,
                      context: s.context,
                      scannedAt: s.scannedAt,
                      finderName: s.finderName,
                    }))}
                    destination={baggage.destination}
                  />
                ) : (
                  <LeafletMap
                    scans={[{
                      id: 'last',
                      latitude: data.lastPosition.latitude!,
                      longitude: data.lastPosition.longitude!,
                      location: data.lastPosition.address,
                      city: null,
                      country: null,
                      context: 'static_location',
                      scannedAt: baggage.lastScanDate || new Date().toISOString(),
                      finderName: null,
                    }]}
                    destination={baggage.destination}
                  />
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Scrollable Content ─── */}
      <div className="flex-1 max-w-md mx-auto w-full px-4 sm:px-5 md:px-8 py-4 pb-32 space-y-4">

        {/* ═══ SOCIAL SHARE BAR ═══ */}
        {data.scans.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#1a1a1a]/60 font-medium">
              {lang === 'ar' ? 'مشاركة' : lang === 'en' ? 'Share' : 'Partager'}
            </span>
            <SocialShareButtons
              reference={reference}
              scanCount={data.scans.length}
              lastCity={data.scans[0]?.city}
              lastCountry={data.scans[0]?.country}
              status={baggage.status}
              lang={lang}
            />
          </div>
        )}

        {/* ═══ PROACTIVE LOSS ALERT ═══ */}
        <LossAlertBanner
          reference={reference}
          departureDate={baggage.departureDate}
          hasScans={data.scans.length > 0}
          lang={lang}
        />

        {/* ═══ EN-TÊTE DYNAMIQUE SELON STATUT ═══ */}
        <div className="text-center pt-2">
          <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-bold ${statusConfig.badgeClass}`}>
            {statusConfig.title}
          </span>
          <p className="mt-3 text-sm md:text-base text-white/90 leading-relaxed">
            {statusConfig.desc}
          </p>
          {data.scans.length > 0 && (
            <p className="mt-1 text-xs text-white/70">
              {t('tracking.scan_count', { count: String(data.scans.length) })}
            </p>
          )}
        </div>

        {/* ═══ PANNEAU URGENCE (mode perdu uniquement) ═══ */}
        {isDeclaredLost && (
          <div
            className="bg-[#FEF2F2] border-2 border-[#EF4444] rounded-2xl p-6 space-y-5"
            role="alert"
          >
            {/* Titre */}
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-bold text-[#EF4444]">
                {t('tracking.urgent_title')}
              </h2>
            </div>

            {/* Instructions numérotées */}
            <ol className="space-y-3">
              <li className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-7 h-7 bg-[#EF4444] text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">1</span>
                <p className="text-sm md:text-base text-[#1a1a1a] leading-relaxed">
                  {t('tracking.urgent_step1', { company: transportCompany })}
                </p>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-7 h-7 bg-[#EF4444] text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">2</span>
                <p className="text-sm md:text-base text-[#1a1a1a] leading-relaxed">
                  {t('tracking.urgent_step2')}
                </p>
              </li>
            </ol>

            {/* Boutons d'action urgence */}
            <div className="space-y-3">
              {hasFinderPhone && (
                <button
                  onClick={handleWhatsApp}
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe57] text-white py-3.5 px-4 rounded-xl font-bold transition-colors text-base min-h-[48px]"
                >
                  <MessageCircle className="w-5 h-5" />
                  {t('tracking.urgent_contact_finder')}
                </button>
              )}
              <button
                onClick={handleSupportWhatsApp}
                className="w-full flex items-center justify-center gap-2 bg-[#EF4444] hover:bg-[#DC2626] text-white py-3.5 px-4 rounded-xl font-bold transition-colors text-base min-h-[48px]"
              >
                <AlertTriangle className="w-5 h-5" />
                {t('tracking.urgent_support')}
              </button>
            </div>

            {/* Bouton Retrouvé */}
            <button
              onClick={() => handleStatusToggle('mark-found')}
              disabled={isTogglingStatus}
              className="w-full flex items-center justify-center gap-2 bg-white border-2 border-green-600 text-green-700 hover:bg-green-50 py-3.5 px-4 rounded-xl font-bold transition-colors text-base min-h-[48px] disabled:opacity-50"
            >
              {isTogglingStatus ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              {t('tracking.urgent_found_btn')}
            </button>
          </div>
        )}

        {/* ═══ CARTE TROUVEUR (white + dashed, lecture seule) ═══ */}
        {data.lastFinder && (data.lastFinder.name || data.lastFinder.phone) ? (
          <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-5 shadow-sm">
            <h2 className="text-xs uppercase tracking-widest text-[#1a1a1a] font-bold mb-3 flex items-center gap-2">
              <span>🔍</span> {t('tracking.finder_info')}
            </h2>

            {data.lastFinder.name && (
              <DashedEncart>
                <div className="flex items-center gap-3">
                  <span className="text-xl">👤</span>
                  <div>
                    <p className="text-xs text-[#1a1a1a]/60 font-medium">{t('finder.fullName')}</p>
                    <p className="text-base font-bold text-[#1a1a1a]">{data.lastFinder.name}</p>
                  </div>
                </div>
              </DashedEncart>
            )}

            {data.lastFinder.phone && (
              <DashedEncart className="mb-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📱</span>
                  <div>
                    <p className="text-xs text-[#1a1a1a]/60 font-medium">{t('finder.whatsapp')}</p>
                    <p className="text-base font-bold text-[#1a1a1a]" dir="ltr">{data.lastFinder.phone}</p>
                  </div>
                </div>
              </DashedEncart>
            )}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl p-5 shadow-sm text-center">
            <div className="w-14 h-14 bg-[#F59E0B]/20 border-2 border-dashed border-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-7 h-7 text-[#1a1a1a]/60" />
            </div>
            <p className="text-[#1a1a1a]/70 text-sm">{t('tracking.no_finder')}</p>
          </div>
        )}

        {/* ═══ CTA CHECKLIST (jaune #F59E0B + dashed) ═══ */}
        <div className="bg-[#F59E0B] border-2 border-dashed border-[#1a1a1a] rounded-2xl p-4 shadow-sm">
          <h3 className="text-base font-bold text-[#1a1a1a] mb-1">{t('tracking.checklist_title')}</h3>
          <p className="text-sm text-[#1a1a1a]/80 mb-3 leading-relaxed">{t('tracking.checklist_desc')}</p>
          <a
            href={checklistHref}
            className="block w-full text-center py-3 px-4 bg-[#1a1a1a] hover:bg-black text-[#F59E0B] rounded-xl font-bold transition-colors min-h-[44px]"
          >
            {t('tracking.checklist_cta')}
          </a>
        </div>

        {/* ═══ HISTORIQUE (ACCORDION) ═══ */}
        {data.scans.length > 0 && (
          <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => setHistoryOpen(!historyOpen)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
              aria-expanded={historyOpen}
            >
              <h2 className="text-xs uppercase tracking-widest text-[#1a1a1a] font-bold flex items-center gap-2">
                <span>📜</span>
                {t('tracking.history_toggle', { count: String(data.scans.length) })}
              </h2>
              <ChevronDown className={`w-4 h-4 text-[#1a1a1a] transition-transform ${historyOpen ? '' : '-rotate-90'}`} />
            </button>

            {historyOpen && (
              <div className="px-5 pb-4 space-y-2.5">
                {visibleScans.map((scan, index) => (
                  <DashedEncart key={scan.id} className={index === visibleScans.length - 1 && !showAllScans ? 'mb-0' : ''}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs text-[#1a1a1a]/70">
                            {formatDateTime(scan.scannedAt)}
                          </span>
                          <ContextBadge context={scan.context} t={t} />
                        </div>
                        {scan.location && (
                          <p className="text-[#1a1a1a] font-medium text-sm truncate">
                            📍 {scan.location}
                          </p>
                        )}
                        {scan.finderName && (
                          <p className="text-[#1a1a1a]/70 text-xs mt-1">
                            👤 {scan.finderName}
                          </p>
                        )}
                      </div>
                      <div className="w-7 h-7 rounded-full bg-[#F59E0B]/20 border border-[#1a1a1a]/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-[#1a1a1a]">{index + 1}</span>
                      </div>
                    </div>
                  </DashedEncart>
                ))}

                {hiddenScansCount > 0 && !showAllScans && (
                  <button
                    onClick={() => setShowAllScans(true)}
                    className="w-full py-2.5 text-center text-sm font-medium text-[#1a1a1a] hover:text-[#F59E0B] border-2 border-dashed border-[#1a1a1a]/40 rounded-xl transition-colors min-h-[40px]"
                  >
                    {t('tracking.see_more', { count: String(hiddenScansCount) })} ▼
                  </button>
                )}
                {showAllScans && hiddenScansCount > 0 && (
                  <button
                    onClick={() => setShowAllScans(false)}
                    className="w-full py-2.5 text-center text-sm font-medium text-[#1a1a1a]/70 hover:text-[#F59E0B] transition-colors min-h-[40px]"
                  >
                    ▲ Réduire
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ INFOS BAGAGE (COLLAPSIBLE, replié par défaut) ═══ */}
        <div className="bg-white border-2 border-dashed border-[#1a1a1a] rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setBaggageOpen(!baggageOpen)}
            className="w-full flex items-center justify-between px-5 py-4 text-left"
            aria-expanded={baggageOpen}
          >
            <h2 className="text-xs uppercase tracking-widest text-[#1a1a1a] font-bold flex items-center gap-2">
              <span>📦</span> {t('tracking.baggage_info_toggle')}
            </h2>
            <ChevronDown className={`w-4 h-4 text-[#1a1a1a] transition-transform ${baggageOpen ? '' : '-rotate-90'}`} />
          </button>

          {baggageOpen && (
            <div className="px-5 pb-5">
              {/* Reference */}
              <DashedEncart>
                <div className="flex items-center gap-3">
                  <span className="text-xl">🏷️</span>
                  <div>
                    <p className="text-xs text-[#1a1a1a]/60 font-medium">{t('whatsapp.reference').replace(' :', '')}</p>
                    <p className="text-base font-bold text-[#1a1a1a] font-mono tracking-widest">{baggage.reference}</p>
                  </div>
                </div>
              </DashedEncart>

              {/* Traveler Name */}
              <DashedEncart>
                <div className="flex items-center gap-3">
                  <span className="text-xl">👤</span>
                  <div>
                    <p className="text-xs text-[#1a1a1a]/60 font-medium">{t('finder.fullName')}</p>
                    <p className="text-base font-bold text-[#1a1a1a]">{baggage.travelerName || t('finder.notSet')}</p>
                  </div>
                </div>
              </DashedEncart>

              {/* TRANSPORT-FEATURE: Conditional transport info with real PNG images */}
              {(() => {
                const mode = safeTransportMode(baggage.transportMode) as TransportMode;
                const transportImg = getTransportImage(mode);

                if (mode === 'flight' && (baggage.airlineName || baggage.flightNumber)) {
                  return (
                    <DashedEncart>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {baggage.airlineName && (
                            <div className="mb-1">
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
                          <Image src={transportImg} alt="flight" width={28} height={28} className="mix-blend-multiply" />
                        </div>
                      </div>
                    </DashedEncart>
                  );
                }
                if (mode === 'train' && (baggage.trainCompany || baggage.trainNumber)) {
                  return (
                    <DashedEncart>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {baggage.trainCompany && (
                            <div className="mb-1">
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
                          <Image src={transportImg} alt="train" width={28} height={28} className="mix-blend-multiply" />
                        </div>
                      </div>
                    </DashedEncart>
                  );
                }
                if (mode === 'boat' && (baggage.shipName || baggage.shipCabin)) {
                  return (
                    <DashedEncart>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {baggage.shipName && (
                            <div className="mb-1">
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
                          <Image src={transportImg} alt="boat" width={28} height={28} className="mix-blend-multiply" />
                        </div>
                      </div>
                    </DashedEncart>
                  );
                }
                if (mode === 'bus' && (baggage.busCompany || baggage.busLineNumber)) {
                  return (
                    <DashedEncart>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {baggage.busCompany && (
                            <div className="mb-1">
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
                          <Image src={transportImg} alt="bus" width={28} height={28} className="mix-blend-multiply" />
                        </div>
                      </div>
                    </DashedEncart>
                  );
                }
                return null;
              })()}

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
          )}
        </div>

        {/* ═══ SUPPORT MAILTO ═══ */}
        <div className="text-center py-2">
          <a
            href={supportHref}
            className="text-sm text-[#F59E0B] underline hover:text-[#1a1a1a] transition-colors"
          >
            {t('tracking.support_cta')}
          </a>
        </div>

        {/* ═══ LAISSER UN AVIS (jaune plein + texte noir) ═══ */}
        {data.scans.length > 0 && (
          <button
            onClick={() => setShowReviewModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-[#1a1a1a] text-[#1a1a1a] hover:text-[#F59E0B] border-2 border-[#1a1a1a] py-3.5 px-4 rounded-xl font-bold transition-colors text-base min-h-[48px]"
          >
            <Star className="w-5 h-5" />
            {lang === 'ar' ? 'تقييم تجربتك' : lang === 'en' ? 'Rate your experience' : 'Laisser un avis'}
          </button>
        )}

        {/* ═══ PWA INSTALL BUTTON (jaune plein + texte noir) ═══ */}
        {showInstallButton && (
          <div className="text-center">
            <button
              onClick={() => {
                if (isIOS) {
                  setShowIOSModal(true);
                } else {
                  handleInstall();
                }
              }}
              className="inline-flex items-center gap-2 bg-[#F59E0B] hover:bg-[#1a1a1a] text-[#1a1a1a] hover:text-[#F59E0B] border-2 border-[#1a1a1a] py-2.5 px-5 rounded-lg text-sm font-bold transition-colors min-h-[44px]"
            >
              <span>{isIOS ? '📱' : '⬇️'}</span>
              <span>{isIOS ? t('tracking.install_app_ios') : t('tracking.install_app')}</span>
            </button>
          </div>
        )}

        {/* ═══ BOUTON DÉCLARER PERDU (rouge fond + texte blanc) ═══ */}
        {!isDeclaredLost && (
          <button
            onClick={() => handleStatusToggle('mark-lost')}
            disabled={isTogglingStatus}
            className="w-full flex items-center justify-center gap-2 bg-[#EF4444] hover:bg-[#DC2626] text-white py-3.5 px-4 rounded-xl font-bold transition-colors text-base min-h-[48px] disabled:opacity-50"
          >
            {isTogglingStatus ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            {t('tracking.declare_lost_btn')}
          </button>
        )}

        {/* ─── Trust Note (footer discret) ─── */}
        <div className="text-center text-xs text-white/70 tracking-wide flex items-center justify-center gap-1.5 pt-2">
          <Shield className="w-4 h-4 inline" />
          <span>{t('tracking.trust_note')}</span>
        </div>
      </div>

      {/* ═══ STICKY BOTTOM BAR (Appeler + WhatsApp) — only if finder phone AND NOT in lost mode ═══ */}
      {hasFinderPhone && !isDeclaredLost && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-[#1a1a1a] p-3 sm:p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          <div className="max-w-md mx-auto flex gap-3">
            <button
              onClick={handlePhoneCall}
              className="flex-1 bg-[#1a1a1a] hover:bg-black text-[#F59E0B] py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-base min-h-[48px]"
              aria-label={t('tracking.by_phone')}
            >
              <Phone className="w-5 h-5" />
              <span>📞 {t('tracking.by_phone')}</span>
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex-1 bg-[#25D366] hover:bg-[#1ebe57] text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 text-base min-h-[48px]"
              aria-label={t('tracking.by_whatsapp')}
            >
              <MessageCircle className="w-5 h-5" />
              <span>💬 {t('tracking.by_whatsapp')}</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══ iOS Install Instructions Modal ═══ */}
      <IOSInstallModal show={showIOSModal} onClose={() => setShowIOSModal(false)} t={t} />

      {/* ═══ Review Modal ═══ */}
      <ReviewModal
        show={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        reference={reference}
        lang={lang}
      />
    </main>
  );
}
