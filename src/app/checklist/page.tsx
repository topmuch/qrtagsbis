'use client';

import { useState, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/hooks/useTranslation';
import { toast } from '@/hooks/use-toast';
import {
  DEFAULT_CHECKLIST_CATEGORIES,
  ITEM_COLORS,
  ITEM_BRANDS,
  getItemImageUrl,
  type ChecklistItem,
} from '@/lib/checklist-catalog';
import {
  Plane,
  Calendar,
  Globe,
  User,
  Mail,
  Package,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Lock,
  ExternalLink,
  Sparkles,
  Camera,
  MapPin,
  Tag,
  FileText,
  Plus,
  Minus,
  Trash2,
  ChevronDown,
  X,
} from 'lucide-react';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

// Nav links — same as homepage Navigation component
const NAV_LINKS = [
  { label: 'Accueil', href: '/' },
  { label: 'Checklist', href: '/checklist' },
  { label: 'À propos', href: '/#comment' },
  { label: 'Tarifs', href: '/#tarifs' },
  { label: 'Contactez-nous', href: '/contact' },
];

interface SelectedItem {
  category: string;
  name: string;
  qty: number;
  color?: string;
  brand?: string;
}

export default function ChecklistPage() {
  return (
    <Suspense fallback={<ChecklistFallback />}>
      <ChecklistPageContent />
    </Suspense>
  );
}

function ChecklistFallback() {
  return (
    <main className="min-h-screen flex flex-col bg-[#f8fafc]" dir="ltr">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="mt-4 text-slate-500 text-sm">Chargement…</p>
        </div>
      </div>
    </main>
  );
}

function ChecklistPageContent() {
  const { t, lang, setLang, dir } = useTranslation();
  const searchParams = useSearchParams();
  const refParam = searchParams.get('ref');
  const sourceParam = searchParams.get('source');

  // ─── Form state ───
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [airline, setAirline] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItem>>({});
  const [activeCategory, setActiveCategory] = useState<string>(DEFAULT_CHECKLIST_CATEGORIES[0].id);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    code: string;
    publicUrl: string;
    verificationKey: string;
    emailSent: boolean;
  } | null>(null);

  const selectedList = useMemo(() => Object.values(selectedItems), [selectedItems]);
  const selectedCount = selectedList.length;

  // Toggle an item
  const toggleItem = useCallback((category: string, name: string) => {
    const key = `${category}__${name}`;
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = { category, name, qty: 1 };
      }
      return next;
    });
  }, []);

  // Change quantity
  const changeQty = useCallback((category: string, name: string, delta: number) => {
    const key = `${category}__${name}`;
    setSelectedItems((prev) => {
      const item = prev[key];
      if (!item) return prev;
      const newQty = Math.max(1, Math.min(99, item.qty + delta));
      return { ...prev, [key]: { ...item, qty: newQty } };
    });
  }, []);

  // Change color
  const changeColor = useCallback((category: string, name: string, color: string) => {
    const key = `${category}__${name}`;
    setSelectedItems((prev) => {
      const item = prev[key];
      if (!item) return prev;
      return { ...prev, [key]: { ...item, color } };
    });
  }, []);

  // Change brand
  const changeBrand = useCallback((category: string, name: string, brand: string) => {
    const key = `${category}__${name}`;
    setSelectedItems((prev) => {
      const item = prev[key];
      if (!item) return prev;
      return { ...prev, [key]: { ...item, brand } };
    });
  }, []);

  // Select/unselect all items in current category
  const toggleCategoryAll = useCallback((categoryId: string) => {
    const cat = DEFAULT_CHECKLIST_CATEGORIES.find((c) => c.id === categoryId);
    if (!cat) return;
    const allSelected = cat.items.every((name) => selectedItems[`${categoryId}__${name}`]);
    setSelectedItems((prev) => {
      const next = { ...prev };
      for (const name of cat.items) {
        const key = `${categoryId}__${name}`;
        if (allSelected) {
          delete next[key];
        } else {
          next[key] = { category: categoryId, name, qty: 1 };
        }
      }
      return next;
    });
  }, [selectedItems]);

  // ─── Submit ───
  const handleSubmit = useCallback(async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !departureDate || !destinationCountry.trim()) {
      toast({ title: t('checklist.need_fields'), variant: 'destructive' });
      return;
    }
    if (selectedCount === 0) {
      toast({ title: t('checklist.need_items'), variant: 'destructive' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: t('checklist.need_fields'), variant: 'destructive' });
      return;
    }

    setSubmitting(true);

    // Upload photo first if selected
    let photoPath: string | null = null;
    let photoSizeBytes = 0;
    if (photoFile) {
      setPhotoUploading(true);
      try {
        const photoForm = new FormData();
        photoForm.append('file', photoFile);
        const photoRes = await fetch('/api/checklist/upload-photo', {
          method: 'POST',
          body: photoForm,
        });
        const photoData = await photoRes.json();
        if (photoRes.ok && photoData.success) {
          photoPath = photoData.photoPath;
          photoSizeBytes = photoData.photoSizeBytes;
        } else {
          toast({ title: photoData.error || 'Erreur upload photo', variant: 'destructive' });
          setPhotoUploading(false);
          setSubmitting(false);
          return;
        }
      } catch {
        toast({ title: 'Erreur lors du téléchargement de la photo', variant: 'destructive' });
        setPhotoUploading(false);
        setSubmitting(false);
        return;
      }
      setPhotoUploading(false);
    }

    try {
      const res = await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          departureDate,
          destinationCountry: destinationCountry.trim(),
          airline: airline.trim() || null,
          items: selectedList.map((it) => ({ ...it, checked: true } as ChecklistItem)),
          photoPath,
          photoSizeBytes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || t('checklist.error'));
      }
      setSuccess({
        code: data.code,
        publicUrl: data.publicUrl,
        verificationKey: data.verificationKey,
        emailSent: data.emailSent !== false,
      });
      toast({ title: t('checklist.success_title') });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('checklist.error');
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }, [firstName, lastName, email, departureDate, destinationCountry, airline, selectedList, selectedCount, t]);

  // ─── Success screen ───
  if (success) {
    return (
      <main className="min-h-screen bg-[#f8fafc] flex flex-col" dir={dir}>
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 py-2.5">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <img src="/logo.png" alt="QRTags" className="h-16 w-auto object-contain" />
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <a key={link.href} href={link.href} className="px-3 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-50">
                  {link.label}
                </a>
              ))}
            </div>
            <LanguageSelector lang={lang} setLang={setLang} variant="blue" />
          </div>
        </header>

        <section className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-lg">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
              {t('checklist.success_title')}
            </h1>
            <p className="text-center text-slate-600 mb-6">
              {t('checklist.success_desc')}
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-3">
              <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">{t('checklist.success_code')}</div>
              <div className="font-mono font-bold text-xl text-slate-900">{success.code}</div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-3">
              <div className="text-xs uppercase tracking-widest text-red-600 mb-1 flex items-center gap-1">
                <Lock className="w-3 h-3" /> {t('checklist.success_key')}
              </div>
              <div className="font-mono font-bold text-2xl text-red-600 tracking-widest">{success.verificationKey}</div>
            </div>

            <div className="bg-slate-900 rounded-xl p-4 mb-6">
              <div className="text-xs uppercase tracking-widest text-blue-400 mb-1">{t('checklist.success_url')}</div>
              <div className="text-white text-sm font-mono break-all">{success.publicUrl}</div>
            </div>

            <div className="flex flex-col gap-2.5">
              <Link
                href={`/checklist/${success.code}`}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-600/25"
              >
                <ExternalLink className="w-4 h-4" />
                {t('checklist.view_public_page')}
              </Link>
              <button
                onClick={() => {
                  setSuccess(null);
                  setFirstName('');
                  setLastName('');
                  setEmail('');
                  setDepartureDate('');
                  setDestinationCountry('');
                  setAirline('');
                  setSelectedItems({});
                }}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-300 transition-colors"
              >
                {t('checklist.create_another')}
              </button>
            </div>

            {!success.emailSent && (
              <p className="text-xs text-amber-700 text-center mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                ⚠️ L'email n'a pas pu être envoyé automatiquement. Notez votre clé de vérification et l'URL publique ci-dessus.
              </p>
            )}
          </div>
        </section>

        <footer className="bg-slate-900 text-slate-300 text-center py-3 mt-auto">
          <p className="text-xs">QRTags — Protection intelligente des objets • qrtagss.com</p>
        </footer>
      </main>
    );
  }

  // ─── Form screen ───
  const activeCat = DEFAULT_CHECKLIST_CATEGORIES.find((c) => c.id === activeCategory) || DEFAULT_CHECKLIST_CATEGORIES[0];
  const allCatSelected = activeCat.items.every((name) => selectedItems[`${activeCat.id}__${name}`]);
  const canSubmit = selectedCount > 0 && !submitting;

  // Localized label helper
  const catLabel = (cat: typeof activeCat) => cat.label[lang as keyof typeof cat.label] || cat.label.fr;

  return (
    <main className="min-h-screen bg-[#f8fafc] flex flex-col" dir={dir}>
      {/* ─── Header (matches homepage: logo + nav + LanguageSelector + Generate PDF) ─── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <img src="/logo.png" alt="QRTags" className="h-16 w-auto object-contain" />
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="px-3 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-50">
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector lang={lang} setLang={setLang} variant="blue" />
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[40px] shadow-md shadow-blue-600/25"
            >
              {submitting || photoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {photoUploading ? 'Envoi de la photo...' : t('checklist.header_generate_pdf')}
            </button>
          </div>
        </div>
      </header>

      <section className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {/* ─── Title block ─── */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            {refParam && sourceParam === 'tracking_page' ? '✨ Checklist gratuite' : '✨ Service gratuit QRTags'}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            {t('checklist.title')}
          </h1>
          <p className="text-slate-600 text-sm">{t('checklist.subtitle')}</p>
        </div>

        {/* ─── Section 1: Travel Information ─── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 mb-4 shadow-sm">
          <h2 className="flex items-center gap-2 text-slate-900 font-bold text-base mb-4">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
            <MapPin className="w-4 h-4 text-blue-600" />
            {t('checklist.step_passenger')}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center gap-1">
                <User className="w-3 h-3" /> {t('checklist.first_name')} *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                placeholder="Aïssatou"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center gap-1">
                <User className="w-3 h-3" /> {t('checklist.last_name')} *
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                placeholder="Diallo"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center gap-1">
                <Mail className="w-3 h-3" /> {t('checklist.email')} *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                placeholder="aissatou@email.com"
              />
              <p className="text-[10px] text-slate-500 mt-1">{t('checklist.email_hint')}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {t('checklist.departure_date')} *
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center gap-1">
                <Globe className="w-3 h-3" /> {t('checklist.destination_country')} *
              </label>
              <input
                type="text"
                value={destinationCountry}
                onChange={(e) => setDestinationCountry(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                placeholder="Ex: Paris, Tokyo..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 mb-1 block flex items-center gap-1">
                <Plane className="w-3 h-3" /> {t('checklist.airline')}
              </label>
              <input
                type="text"
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
                placeholder={t('checklist.airline_placeholder')}
              />
            </div>
          </div>
        </div>

        {/* ─── Section 2: Photo upload (optional) ─── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 mb-4 shadow-sm">
          <h2 className="flex items-center gap-2 text-slate-900 font-bold text-base mb-4">
            <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
            <Camera className="w-4 h-4 text-blue-600" />
            {t('checklist.photo_upload_title')}
          </h2>
          {photoPreview ? (
            <div className="relative inline-block">
              <img src={photoPreview} alt="Aperçu photo" className="max-h-48 rounded-xl border border-slate-200 object-contain" />
              <button
                type="button"
                onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors shadow-md"
                aria-label="Supprimer la photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-slate-300 rounded-xl py-8 px-4 text-center hover:border-blue-500 hover:bg-blue-50/60 transition-colors">
                <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-900">{t('checklist.photo_upload_hint')}</p>
                <p className="text-xs text-slate-500 mt-1">{t('checklist.photo_upload_optional')}</p>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setPhotoFile(file);
                  const reader = new FileReader();
                  reader.onload = () => setPhotoPreview(reader.result as string);
                  reader.readAsDataURL(file);
                }}
              />
            </label>
          )}
        </div>

        {/* ─── Section 3: Items grid ─── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="flex items-center gap-2 text-slate-900 font-bold text-base">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</span>
              <Tag className="w-4 h-4 text-blue-600" />
              {t('checklist.step_items')}
            </h2>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              {t('checklist.items_in_category', { count: String(activeCat.items.length) })}
            </span>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
            {DEFAULT_CHECKLIST_CATEGORIES.map((cat) => {
              const isActive = cat.id === activeCategory;
              const catSelectedCount = cat.items.filter((name) => selectedItems[`${cat.id}__${name}`]).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                    isActive
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-300 text-slate-600 hover:border-blue-500 hover:text-blue-700'
                  }`}
                >
                  <span className="mr-1">{cat.emoji}</span>
                  {catLabel(cat)}
                  {catSelectedCount > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-slate-900 text-white rounded-full text-[10px]">
                      {catSelectedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Select all */}
          <button
            onClick={() => toggleCategoryAll(activeCat.id)}
            className="text-xs font-bold text-blue-600 underline mb-3 hover:text-blue-800"
          >
            {allCatSelected ? t('checklist.unselect_all') : t('checklist.select_all')}
          </button>

          {/* Items grid — 4 columns on desktop, 2 on mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {activeCat.items.map((name) => {
              const key = `${activeCat.id}__${name}`;
              const isSelected = !!selectedItems[key];
              const imageUrl = getItemImageUrl(activeCat.id, name);
              return (
                <button
                  key={key}
                  onClick={() => toggleItem(activeCat.id, name)}
                  className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all text-left bg-white ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 shadow-md'
                      : 'border-slate-200 hover:border-blue-400'
                  }`}
                  aria-pressed={isSelected}
                >
                  {/* Checkmark badge */}
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center z-10">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {/* Image / Emoji tile */}
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center relative">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        className={`object-contain p-2 transition-transform ${isSelected ? 'scale-105' : ''}`}
                        unoptimized
                      />
                    ) : (
                      <span className="text-4xl">{activeCat.emoji}</span>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-600/10 pointer-events-none" />
                    )}
                  </div>

                  {/* Name + qty badge */}
                  <div className="w-full text-center">
                    <div className="text-xs font-semibold text-slate-900 leading-tight line-clamp-2">{name}</div>
                    {isSelected && selectedItems[key].qty > 1 && (
                      <div className="mt-0.5 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 bg-slate-900 text-white rounded-full text-[10px] font-bold">
                        ×{selectedItems[key].qty}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Section 4: Selection list with qty + color + brand ─── */}
        {selectedCount > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">4</span>
                <FileText className="w-4 h-4 text-blue-600" />
                {t('checklist.step_selection')} ({selectedCount})
              </h2>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {DEFAULT_CHECKLIST_CATEGORIES.map((cat) => {
                const catItems = selectedList.filter((it) => it.category === cat.id);
                if (catItems.length === 0) return null;
                return (
                  <div key={cat.id}>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-2 mb-1 flex items-center gap-1">
                      <span>{cat.emoji}</span>
                      <span>{catLabel(cat)}</span>
                    </div>
                    {catItems.map((it) => {
                      const key = `${it.category}__${it.name}`;
                      const imageUrl = getItemImageUrl(it.category, it.name);
                      return (
                        <div
                          key={key}
                          className="flex flex-wrap items-center gap-2 py-2 px-2 bg-slate-50 border border-slate-200 rounded-lg"
                        >
                          {/* Image */}
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={it.name}
                                width={48}
                                height={48}
                                className="object-contain p-1"
                                unoptimized
                              />
                            ) : (
                              <span className="text-2xl">{cat.emoji}</span>
                            )}
                          </div>

                          {/* Name */}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">{it.name}</div>
                          </div>

                          {/* Qty controls */}
                          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg">
                            <button
                              onClick={() => changeQty(it.category, it.name, -1)}
                              className="w-7 h-7 flex items-center justify-center text-slate-700 hover:bg-blue-100 hover:text-blue-700 rounded-l-md"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold w-6 text-center text-slate-900">{it.qty}</span>
                            <button
                              onClick={() => changeQty(it.category, it.name, 1)}
                              className="w-7 h-7 flex items-center justify-center text-slate-700 hover:bg-blue-100 hover:text-blue-700 rounded-r-md"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Color dropdown */}
                          <div className="relative">
                            <select
                              value={it.color || ''}
                              onChange={(e) => changeColor(it.category, it.name, e.target.value)}
                              className="appearance-none pl-2 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer min-h-[32px]"
                              aria-label={t('checklist.item_color')}
                            >
                              <option value="">{t('checklist.item_color')}</option>
                              {ITEM_COLORS.map((c) => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                          </div>

                          {/* Brand dropdown */}
                          <div className="relative">
                            <select
                              value={it.brand || ''}
                              onChange={(e) => changeBrand(it.category, it.name, e.target.value)}
                              className="appearance-none pl-2 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer min-h-[32px]"
                              aria-label={t('checklist.item_brand')}
                            >
                              <option value="">{t('checklist.item_brand')}</option>
                              {ITEM_BRANDS.map((b) => (
                                <option key={b} value={b}>{b}</option>
                              ))}
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                          </div>

                          {/* Delete */}
                          <button
                            onClick={() => toggleItem(it.category, it.name)}
                            className="w-7 h-7 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-md"
                            aria-label={t('checklist.remove')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Submit button (sticky bottom on mobile, inline on desktop) ─── */}
        <div className="sticky bottom-3 z-20">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-base md:text-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px]"
          >
            {submitting || photoUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {photoUploading ? 'Envoi de la photo...' : t('checklist.submitting')}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {t('checklist.submit')}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          <p>🔒 Vos données restent confidentielles • 📧 PDF envoyé par email • ✅ Attestation horodatée</p>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-300 text-center py-3 mt-auto">
        <p className="text-xs">QRTags — Protection intelligente des objets • qrtagss.com</p>
      </footer>
    </main>
  );
}
