'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from '@/hooks/use-toast';
import { DEFAULT_CHECKLIST_CATEGORIES } from '@/lib/checklist-catalog';
import {
  Lock,
  Loader2,
  Download,
  Printer,
  ArrowLeft,
  Calendar,
  Globe,
  Plane,
  User,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Mail,
  Search,
  ExternalLink,
  Camera,
} from 'lucide-react';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

interface ChecklistView {
  status: 'locked' | 'unlocked' | 'not_found' | 'loading' | 'error';
  code?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  departureDate?: string;
  destinationCountry?: string;
  airline?: string | null;
  items?: Array<{ category: string; name: string; qty: number; checked: boolean }>;
  itemsCount?: number;
  createdAt?: string;
  viewCount?: number;
 hasPhoto?: boolean;
  error?: string;
}

interface HistoryItem {
  code: string;
  firstName: string;
  lastName: string;
  destinationCountry: string;
  departureDate: string;
  itemsCount: number;
  emailSent: boolean;
  viewCount: number;
  createdAt: string;
}

export default function ChecklistViewPage() {
  const { t, lang, setLang, dir } = useTranslation();
  const params = useParams();
  const code = (params?.code as string || '').toUpperCase();

  const [view, setView] = useState<ChecklistView>({ status: 'loading' });
  const [keyInput, setKeyInput] = useState('');
  const [verifying, setVerifying] = useState(false);

  // History panel
  const [showHistory, setShowHistory] = useState(false);
  const [historyEmail, setHistoryEmail] = useState('');
  const [historyItems, setHistoryItems] = useState<HistoryItem[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ─── Fetch checklist (locked view) on mount ───
  const fetchChecklist = useCallback(async (key?: string) => {
    setView({ status: 'loading' });
    try {
      const url = key ? `/api/checklist/${code}?key=${encodeURIComponent(key)}` : `/api/checklist/${code}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.status === 404) {
        setView({ status: 'not_found' });
        return;
      }
      setView(data);
    } catch {
      setView({ status: 'error', error: t('checklist.error') });
    }
  }, [code, t]);

  useEffect(() => {
    if (code) fetchChecklist();
  }, [code, fetchChecklist]);

  // ─── Verify key ───
  const handleVerify = useCallback(async () => {
    if (!keyInput.trim()) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/checklist/${code}?key=${encodeURIComponent(keyInput.trim())}`);
      const data = await res.json();
      if (res.status === 403) {
        toast({ title: t('checklist.view_wrong_key'), variant: 'destructive' });
        setVerifying(false);
        return;
      }
      if (res.status === 404) {
        setView({ status: 'not_found' });
        return;
      }
      setView(data);
      if (data.status === 'unlocked') {
        toast({ title: t('checklist.success_title') });
      }
    } catch {
      toast({ title: t('checklist.error'), variant: 'destructive' });
    } finally {
      setVerifying(false);
    }
  }, [code, keyInput, t]);

  // ─── Download PDF ───
  const handleDownloadPdf = useCallback(() => {
    if (!keyInput.trim()) return;
    // Direct browser download via the PDF endpoint
    const url = `/api/checklist/${code}/pdf?key=${encodeURIComponent(keyInput.trim())}`;
    window.open(url, '_blank');
  }, [code, keyInput]);

  // ─── Download photo ───
  const handleDownloadPhoto = useCallback(() => {
    if (!keyInput.trim()) return;
    const url = `/api/checklist/${code}/photo?key=${encodeURIComponent(keyInput.trim())}`;
    window.open(url, '_blank');
  }, [code, keyInput]);

  // ─── Search history ───
  const handleHistorySearch = useCallback(async () => {
    if (!historyEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(historyEmail.trim())) {
      toast({ title: t('checklist.need_fields'), variant: 'destructive' });
      return;
    }
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/checklist?email=${encodeURIComponent(historyEmail.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'error');
      setHistoryItems(data.checklists || []);
    } catch (e) {
      toast({ title: t('checklist.error'), variant: 'destructive' });
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyEmail, t]);

  // Format date
  const formatDate = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const locale = lang === 'ar' ? 'ar-SA' : lang === 'en' ? 'en-US' : 'fr-FR';
      return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };
  const formatDateOnly = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const locale = lang === 'ar' ? 'ar-SA' : lang === 'en' ? 'en-US' : 'fr-FR';
      return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  // Group items by category
  const groupedItems = (() => {
    if (!view.items) return [];
    const map: Record<string, typeof view.items> = {};
    for (const it of view.items) {
      if (!map[it.category]) map[it.category] = [];
      map[it.category].push(it);
    }
    return DEFAULT_CHECKLIST_CATEGORIES
      .map((cat) => ({ cat, items: map[cat.id] || [] }))
      .filter((g) => g.items.length > 0);
  })();

  // ═══ RENDER ═══
  return (
    <main className="min-h-screen bg-[#f8fafc] flex flex-col" dir={dir}>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <img src="/logo.png" alt="QRTags" className="h-16 w-auto object-contain" />
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <a href="/" className="px-3 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-50">Accueil</a>
            <a href="/checklist" className="px-3 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-50">Checklist</a>
            <a href="/#comment" className="px-3 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-50">À propos</a>
            <a href="/#tarifs" className="px-3 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-50">Tarifs</a>
            <a href="/contact" className="px-3 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-50">Contactez-nous</a>
          </div>
          <LanguageSelector lang={lang} setLang={setLang} variant="blue" />
        </div>
      </header>

      <section className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {/* Back link */}
        <Link href="/checklist" className="inline-flex items-center gap-1 text-sm text-[#0f172a]/70 hover:text-[#0f172a] mb-4 font-bold">
          <ArrowLeft className="w-4 h-4" />
          {t('checklist.view_back')}
        </Link>

        {/* Loading state */}
        {view.status === 'loading' && (
          <div className="bg-white border-2 border-solid border-[#0f172a] rounded-2xl p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2563eb] mb-3" />
            <p className="text-[#0f172a]/70 text-sm">Chargement...</p>
          </div>
        )}

        {/* Not found */}
        {view.status === 'not_found' && (
          <div className="bg-white border-2 border-solid border-[#0f172a] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-[#0f172a] mb-2">{t('checklist.view_not_found')}</h1>
            <p className="text-[#0f172a]/70 text-sm">{t('checklist.view_not_found_desc')}</p>
          </div>
        )}

        {/* Locked — ask for verification key */}
        {view.status === 'locked' && (
          <div className="bg-white border-2 border-solid border-[#0f172a] rounded-2xl p-6 md:p-8 shadow-md">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-[#2563eb] flex items-center justify-center border-2 border-[#0f172a]">
                <Lock className="w-8 h-8 text-[#0f172a]" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-[#0f172a] text-center mb-2">
              {t('checklist.view_locked')}
            </h1>
            <p className="text-center text-[#0f172a]/70 text-sm mb-6">
              {t('checklist.view_locked_desc')}
            </p>

            {/* Attestation identity hint */}
            {view.firstName && view.createdAt && (
              <div className="bg-[#eff6ff] border border-[#2563eb] rounded-lg p-3 mb-5 text-center">
                <p className="text-xs text-[#0f172a]/70">
                  Attestation de <strong className="text-[#0f172a]">{view.firstName}</strong> · Code <strong className="font-mono text-[#0f172a]">{view.code}</strong>
                </p>
                <p className="text-xs text-[#0f172a]/70 mt-1">Créée le {formatDate(view.createdAt)}</p>
              </div>
            )}

            <label className="text-xs font-bold text-[#0f172a]/70 mb-2 block">{t('checklist.view_key_input')}</label>
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              className="w-full px-4 py-3 bg-[#f8fafc] border-2 border-[#0f172a] rounded-xl text-[#0f172a] text-base font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#2563eb] min-h-[48px] uppercase"
              placeholder={t('checklist.view_key_placeholder')}
              maxLength={8}
              autoFocus
            />

            <button
              onClick={handleVerify}
              disabled={verifying || !keyInput.trim()}
              className="w-full mt-3 py-3 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-[#0f172a] rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-[#0f172a] disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] transition-colors"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> ...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  {t('checklist.view_unlock')}
                </>
              )}
            </button>

            {view.error && (
              <p className="text-xs text-red-600 text-center mt-3 bg-red-50 border border-red-200 rounded p-2">
                {view.error}
              </p>
            )}

            {/* Search history */}
            <div className="mt-8 border-t border-[#0f172a]/10 pt-6">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs text-[#0f172a]/70 hover:text-[#0f172a] underline font-bold"
              >
                {t('checklist.view_history')}
              </button>
              {showHistory && (
                <div className="mt-3 bg-[#f8fafc] border-2 border-dashed border-[#0f172a]/30 rounded-xl p-4">
                  <p className="text-xs text-[#0f172a]/70 mb-2">{t('checklist.view_history_desc')}</p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={historyEmail}
                      onChange={(e) => setHistoryEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleHistorySearch()}
                      placeholder={t('checklist.view_history_email')}
                      className="flex-1 px-3 py-2 bg-white border-2 border-[#0f172a] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] min-h-[40px]"
                    />
                    <button
                      onClick={handleHistorySearch}
                      disabled={historyLoading}
                      className="px-3 py-2 bg-[#0f172a] text-[#2563eb] rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-black transition-colors disabled:opacity-50"
                    >
                      {historyLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                      {t('checklist.view_history_search')}
                    </button>
                  </div>
                  {historyItems && (
                    <div className="mt-3 space-y-2">
                      {historyItems.length === 0 ? (
                        <p className="text-xs text-[#0f172a]/60 italic">{t('checklist.view_history_empty')}</p>
                      ) : (
                        <>
                          <p className="text-xs font-bold text-[#0f172a]">{t('checklist.view_history_count', { count: historyItems.length })}</p>
                          {historyItems.map((h) => (
                            <Link
                              key={h.code}
                              href={`/checklist/${h.code}`}
                              className="block bg-white border border-[#0f172a]/20 rounded-lg p-3 hover:border-[#2563eb] transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-mono text-xs font-bold text-[#0f172a]">{h.code}</div>
                                  <div className="text-[10px] text-[#0f172a]/70 mt-0.5">
                                    {h.destinationCountry} · {h.itemsCount} articles
                                  </div>
                                  <div className="text-[10px] text-[#0f172a]/50">
                                    {formatDate(h.createdAt)}
                                  </div>
                                </div>
                                <ExternalLink className="w-3 h-3 text-[#0f172a]/50" />
                              </div>
                            </Link>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Unlocked — show full attestation */}
        {view.status === 'unlocked' && (
          <div className="space-y-4">
            {/* Header card */}
            <div className="bg-white border-2 border-solid border-[#0f172a] rounded-2xl overflow-hidden shadow-md">
              <div className="bg-[#2563eb] border-b-2 border-[#0f172a] px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#0f172a] text-lg">🎒 QRTags</div>
                  <div className="text-xs text-[#0f172a]/75">Attestation d'inventaire de voyage</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-[#0f172a]/70">Code</div>
                  <div className="font-mono font-bold text-[#0f172a]">{view.code}</div>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-xl font-bold text-[#0f172a] mb-1">
                      ✅ {t('checklist.success_title')}
                    </h1>
                    <p className="text-xs text-[#0f172a]/70">
                      {t('checklist.view_created_at')} {formatDate(view.createdAt)}
                    </p>
                  </div>
                  <div className="bg-red-50 border-2 border-red-500 rounded-lg px-3 py-1.5 text-center">
                    <div className="text-[9px] uppercase tracking-widest text-red-700 font-bold">Certifié</div>
                    <div className="text-[9px] text-red-600">QRTags</div>
                  </div>
                </div>

                {/* Passenger info */}
                <div className="bg-[#f8fafc] border-2 border-dashed border-[#0f172a]/30 rounded-xl p-4 mb-4">
                  <h2 className="text-xs uppercase tracking-widest text-[#0f172a]/70 font-bold mb-2 flex items-center gap-1">
                    <User className="w-3 h-3" /> {t('checklist.view_passenger_info')}
                  </h2>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-[10px] text-[#0f172a]/60">Nom complet</div>
                      <div className="font-bold text-[#0f172a]">{view.firstName} {view.lastName}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#0f172a]/60 flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> Email</div>
                      <div className="font-bold text-[#0f172a] text-xs truncate">{view.email}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#0f172a]/60 flex items-center gap-1"><Calendar className="w-2.5 h-2.5" /> Date de départ</div>
                      <div className="font-bold text-[#0f172a]">{formatDateOnly(view.departureDate)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#0f172a]/60 flex items-center gap-1"><Globe className="w-2.5 h-2.5" /> Destination</div>
                      <div className="font-bold text-[#0f172a]">{view.destinationCountry}</div>
                    </div>
                    {view.airline && (
                      <div className="col-span-2">
                        <div className="text-[10px] text-[#0f172a]/60 flex items-center gap-1"><Plane className="w-2.5 h-2.5" /> Compagnie aérienne</div>
                        <div className="font-bold text-[#0f172a]">{view.airline}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items list */}
                <div className="mb-4">
                  <h2 className="text-xs uppercase tracking-widest text-[#0f172a]/70 font-bold mb-2">
                    🧳 {t('checklist.view_items_list')} ({view.itemsCount})
                  </h2>
                  <div className="space-y-3">
                    {groupedItems.map(({ cat, items }) => (
                      <div key={cat.id}>
                        <div className="bg-[#2563eb] border border-[#0f172a] rounded-md px-2 py-1 inline-block">
                          <span className="text-xs font-bold text-[#0f172a]">{cat.emoji} {cat.label[lang as keyof typeof cat.label] || cat.label.fr}</span>
                        </div>
                        <div className="mt-1.5 pl-2 space-y-1">
                          {items.map((it) => (
                            <div key={`${it.category}__${it.name}`} className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                              <span className="text-[#0f172a]">{it.name}</span>
                              {it.qty > 1 && (
                                <span className="text-xs text-[#0f172a]/60 bg-[#0f172a]/5 px-1.5 py-0.5 rounded">x{it.qty}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-[10px] text-[#0f172a]/60 border-t border-[#0f172a]/10 pt-3">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {t('checklist.view_view_count', { count: view.viewCount || 0 })}
                  </span>
                  <span className="font-mono">{view.code}</span>
                </div>
              </div>
            </div>

            {/* Photo section */}
            {view.hasPhoto && (
              <div className="bg-white border-2 border-solid border-[#0f172a] rounded-2xl overflow-hidden shadow-md mb-4">
                <div className="bg-[#0f172a] px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#2563eb]" />
                    <span className="text-xs font-bold text-[#2563eb]">Photo de la valise</span>
                  </div>
                  <button
                    onClick={handleDownloadPhoto}
                    className="text-xs text-[#2563eb] hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3 h-3" /> Télécharger
                  </button>
                </div>
                <div className="p-3">
                  <img
                    src={`/api/checklist/${code}/photo?key=${encodeURIComponent(keyInput.trim())}`}
                    alt="Photo de la valise"
                    className="w-full max-h-64 object-contain rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleDownloadPdf}
                className="py-3 px-4 bg-[#2563eb] hover:bg-[#1d4ed8] text-[#0f172a] rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-[#0f172a] transition-colors min-h-[48px]"
              >
                <Download className="w-4 h-4" />
                {t('checklist.view_download_pdf')}
              </button>
              <button
                onClick={() => window.print()}
                className="py-3 px-4 bg-white hover:bg-gray-50 text-[#0f172a] rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-[#0f172a] transition-colors min-h-[48px]"
              >
                <Printer className="w-4 h-4" />
                {t('checklist.view_print')}
              </button>
            </div>

            {/* Embedded PDF preview */}
            <div className="bg-white border-2 border-solid border-[#0f172a] rounded-2xl overflow-hidden shadow-md">
              <div className="bg-[#0f172a] px-4 py-2 flex items-center justify-between">
                <span className="text-xs font-bold text-[#2563eb]">📄 Aperçu du PDF</span>
                <button
                  onClick={handleDownloadPdf}
                  className="text-xs text-[#2563eb] hover:text-white flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> Ouvrir
                </button>
              </div>
              <div className="relative" style={{ height: '600px' }}>
                <iframe
                  src={`/api/checklist/${code}/pdf?key=${encodeURIComponent(keyInput.trim())}`}
                  className="w-full h-full"
                  style={{ border: 'none' }}
                  title={`PDF Preview - ${view.code}`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {view.status === 'error' && (
          <div className="bg-white border-2 border-solid border-[#0f172a] rounded-2xl p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-3" />
            <p className="text-[#0f172a]">{view.error || t('checklist.error')}</p>
            <button
              onClick={() => fetchChecklist()}
              className="mt-4 px-4 py-2 bg-[#2563eb] text-[#0f172a] rounded-lg font-bold border-2 border-[#0f172a]"
            >
              Réessayer
            </button>
          </div>
        )}
      </section>

      <footer className="bg-[#0f172a] text-[#2563eb] text-center py-3 mt-auto">
        <p className="text-xs">QRTags — Protection intelligente des objets • qrtagss.com</p>
      </footer>
    </main>
  );
}
