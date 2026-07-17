'use client';

import { AlertTriangle, Clock, X, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

interface LossAlert {
  id: string;
  alertType: string;
  message: string;
  createdAt: string;
}

interface LossAlertBannerProps {
  reference: string;
  departureDate: string | null;
  hasScans: boolean;
  lang: string;
}

export function LossAlertBanner({ reference, departureDate, hasScans, lang }: LossAlertBannerProps) {
  const [alerts, setAlerts] = useState<LossAlert[]>([]);
  const [dismissing, setDismissing] = useState<string | null>(null);

  // Fetch existing alerts
  useEffect(() => {
    if (!reference) return;
    async function fetchAlerts() {
      try {
        const res = await fetch(`/api/loss-alerts/${reference}`);
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.alerts || []);
        }
      } catch { /* silent */ }
    }
    fetchAlerts();
    // Check every 60s
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [reference]);

  // Proactive loss detection (client-side check)
  const [proactiveMessage, setProactiveMessage] = useState<string | null>(() => {
    if (!departureDate || hasScans) return null;
    const depDate = new Date(departureDate);
    const now = new Date();
    const hoursSinceDeparture = (now.getTime() - depDate.getTime()) / (1000 * 60 * 60);
    if (hoursSinceDeparture > 4 && hoursSinceDeparture < 48) {
      const labels: Record<string, string> = {
        fr: `⚠️ Votre vol est parti il y a ${Math.round(hoursSinceDeparture)}h. Aucun scan de votre objet détecté. Vérifiez au comptoir objets.`,
        en: `⚠️ Your flight departed ${Math.round(hoursSinceDeparture)}h ago. No bag scan detected. Check at the baggage counter.`,
        ar: `⚠️ غادرت رحلتك منذ ${Math.round(hoursSinceDeparture)} ساعة. لم يتم رصد أي مسح لحقيبتك. تحقق من مكتب الأمتعة.`,
      };
      return labels[lang] || labels.fr;
    }
    return null;
  });

  const dismissAlert = useCallback(async (alertId: string) => {
    setDismissing(alertId);
    try {
      const res = await fetch(`/api/loss-alerts/${reference}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      }
    } catch { /* silent */ }
    setDismissing(null);
  }, [reference]);

  // Proactive check (no scans, departure passed)
  if (proactiveMessage && alerts.length === 0) {
    return (
      <div className="bg-[#FEF3C7] border-2 border-[#c5a643] rounded-2xl p-4 flex items-start gap-3">
        <Clock className="w-5 h-5 text-[#c5a643] flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-bold text-[#1a1a1a] mb-0.5">
            {lang === 'fr' ? 'Aucune activité détectée' : lang === 'en' ? 'No activity detected' : 'لم يتم رصد أي نشاط'}
          </p>
          <p className="text-sm text-[#1a1a1a]/80">{proactiveMessage}</p>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div key={alert.id} className="bg-[#FEF2F2] border-2 border-[#EF4444] rounded-2xl p-4 flex items-start gap-3" role="alert">
          <AlertTriangle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-[#EF4444]">
              {lang === 'fr' ? 'Alerte anti-perte' : lang === 'en' ? 'Loss Alert' : 'تنبيه فقدان'}
            </p>
            <p className="text-sm text-[#1a1a1a]/80">{alert.message}</p>
          </div>
          <button
            onClick={() => dismissAlert(alert.id)}
            disabled={dismissing === alert.id}
            className="w-8 h-8 rounded-full hover:bg-[#1a1a1a]/10 flex items-center justify-center flex-shrink-0"
            aria-label="Ignorer"
          >
            {dismissing === alert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          </button>
        </div>
      ))}
    </div>
  );
}