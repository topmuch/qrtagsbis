'use client';

import { useState, useRef, useCallback } from 'react';
import type { Language } from '@/lib/i18n';

// ─── Constants ───
const STORAGE_KEY = 'qrtags_audio_enabled';
const POLL_INTERVAL_MS = 15_000; // 15 seconds
const RECENT_SCAN_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
const NOTIFICATION_ICON = '/icons/icon-192x192.png';

// ─── Types ───
interface ScanEntryForAlert {
  id: string;
  location: string | null;
  city: string | null;
  finderName: string | null;
  scannedAt: string;
}

interface BaggageForAlert {
  reference: string;
  status: string;
  lastScanDate: string | null;
  lastLocation: string | null;
}

interface TTSMessageParams {
  ref: string;
  location: string;
  name?: string;
}

// ─── TTS message templates per locale ───
const TTS_MESSAGES: Record<Language, (p: TTSMessageParams) => string> = {
  fr: (p) => {
    let msg = `Bonne nouvelle ! Votre objet référence ${p.ref} a été localisé`;
    if (p.location) msg += ` à ${p.location}`;
    msg += '.';
    if (p.name) msg += ` Le trouveur s'appelle ${p.name}.`;
    return msg;
  },
  en: (p) => {
    let msg = `Good news! Your baggage reference ${p.ref} has been located`;
    if (p.location) msg += ` at ${p.location}`;
    msg += '.';
    if (p.name) msg += ` The finder's name is ${p.name}.`;
    return msg;
  },
  ar: (p) => {
    let msg = `أخبار سعيدة! تم تحديد موقع أمتعتك المرجع ${p.ref}`;
    if (p.location) msg += ` في ${p.location}`;
    msg += '.';
    if (p.name) msg += ` اسم من وجدها ${p.name}.`;
    return msg;
  },
};

// ─── TTS "enabled" confirmation per locale ───
const TTS_ENABLED_MSG: Record<Language, string> = {
  fr: 'Les alertes sonores sont activées.',
  en: 'Sound alerts are now enabled.',
  ar: 'تم تفعيل التنبيهات الصوتية.',
};

// ─── Locale → Speech API lang tag ───
const LANG_TO_SPEECH: Record<Language, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  ar: 'ar-SA',
};

// ─── Notification title/body per locale ───
const NOTIF_TEXT: Record<Language, { title: string; body: (ref: string, location: string) => string }> = {
  fr: {
    title: 'QRTags — Objet localisé !',
    body: (ref, loc) => `Réf. ${ref} scanné à ${loc}`,
  },
  en: {
    title: 'QRTags — Baggage located!',
    body: (ref, loc) => `Ref. ${ref} scanned at ${loc}`,
  },
  ar: {
    title: 'كيو آر باغ — تم تحديد موقع الأمتعة!',
    body: (ref, loc) => `مرجع ${ref} تم مسحه في ${loc}`,
  },
};

// ─── Helper: safe localStorage ───
function safeGetItem(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSetItem(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* private mode */ }
}

// ─── Helper: is scan recent? ───
function isRecentScan(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return (Date.now() - new Date(dateStr).getTime()) < RECENT_SCAN_THRESHOLD_MS;
}

// ═══════════════════════════════════════════════════════
//  HOOK: useAudioAlert
// ═══════════════════════════════════════════════════════

export function useAudioAlert(lang: Language) {
  // Restore preference lazily (avoids setState-in-effect lint error)
  const [audioEnabled, setAudioEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return safeGetItem(STORAGE_KEY) === 'true';
  });
  const lastNotifiedScanId = useRef<string | null>(null);
  const ttsSupported = useRef(typeof window !== 'undefined' && 'speechSynthesis' in window);
  const notifSupported = useRef(typeof window !== 'undefined' && 'Notification' in window);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ─── Play a synthetic "ding" via AudioContext ───
  const playDing = useCallback(() => {
    try {
      // Reuse or create AudioContext (browsers limit creation)
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;

      // Resume if suspended (autoplay policy)
      if (ctx.state === 'suspended') ctx.resume();

      // Two-tone ding: C5 → E5
      const now = ctx.currentTime;

      // First tone (C5 = 523.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.value = 523.25;
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc1.connect(gain1).connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Second tone (E5 = 659.25 Hz) — slightly delayed
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = 659.25;
      gain2.gain.setValueAtTime(0.3, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } catch {
      // AudioContext not available — silent fallback
    }
  }, []);

  // ─── Speak via TTS ───
  const speak = useCallback((text: string, overrideLang?: Language) => {
    if (!ttsSupported.current) return;
    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANG_TO_SPEECH[overrideLang || lang];
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    } catch {
      // TTS not available
    }
  }, [lang]);

  // ─── Send native notification ───
  const sendNotification = useCallback((title: string, body: string) => {
    if (!notifSupported.current) return;
    try {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: NOTIFICATION_ICON,
          badge: NOTIFICATION_ICON,
          tag: 'qrtags-scan-alert', // prevent duplicates
        });
      }
    } catch {
      // Notification API not available (e.g. iOS non-PWA)
    }
  }, []);

  // ─── Enable audio alerts ───
  const enableAudio = useCallback(() => {
    // Request notification permission if possible
    if (notifSupported.current && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    setAudioEnabled(true);
    safeSetItem(STORAGE_KEY, 'true');

    // Play test sound
    playDing();

    // Speak confirmation after a short delay
    setTimeout(() => {
      speak(TTS_ENABLED_MSG[lang]);
    }, 400);
  }, [playDing, speak, lang]);

  // ─── Disable audio alerts ───
  const disableAudio = useCallback(() => {
    setAudioEnabled(false);
    safeSetItem(STORAGE_KEY, 'false');

    // Stop any ongoing speech
    if (ttsSupported.current) {
      try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
    }
  }, []);

  // ─── Toggle ───
  const toggleAudio = useCallback(() => {
    if (audioEnabled) disableAudio();
    else enableAudio();
  }, [audioEnabled, enableAudio, disableAudio]);

  // ─── Check and notify (call when data changes) ───
  const checkAndNotify = useCallback((
    baggage: BaggageForAlert | null | undefined,
    scans: ScanEntryForAlert[],
  ) => {
    if (!audioEnabled) return;
    if (!baggage || !scans || scans.length === 0) return;

    const lastScan = scans[0];

    // Already notified for this exact scan?
    if (lastNotifiedScanId.current === lastScan.id) return;

    // Only auto-notify for recent scans (< 5 min)
    // If the scan is older, it was already known — don't surprise the user
    if (!isRecentScan(lastScan.scannedAt)) {
      // Still record that we've "seen" this scan to prevent future notifications
      lastNotifiedScanId.current = lastScan.id;
      return;
    }

    // ─── New recent scan detected! ───

    // Build location string
    const location = lastScan.location || lastScan.city || baggage.lastLocation || '';

    // Build TTS message
    const ttsMsg = TTS_MESSAGES[lang]({
      ref: baggage.reference,
      location,
      name: lastScan.finderName || undefined,
    });

    // 1. Play ding
    playDing();

    // 2. Speak after short delay
    setTimeout(() => {
      speak(ttsMsg);
    }, 500);

    // 3. Native notification
    if (location) {
      const notif = NOTIF_TEXT[lang];
      sendNotification(notif.title, notif.body(baggage.reference, location));
    }

    // Mark as notified
    lastNotifiedScanId.current = lastScan.id;
  }, [audioEnabled, lang, playDing, speak, sendNotification]);

  return {
    audioEnabled,
    enableAudio,
    disableAudio,
    toggleAudio,
    checkAndNotify,
  };
}

// ─── Re-export POLL_INTERVAL for the page to use ───
export { POLL_INTERVAL_MS };