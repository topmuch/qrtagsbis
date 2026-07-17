'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  ShieldCheck,
  ShieldX,
  TrendingUp,
  Search,
  RefreshCw,
  MessageCircle,
  Mail,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  Luggage,
  Plane,
  MapPin,
  Clock,
  Building2,
  Phone,
  CalendarDays,
  Filter,
} from "lucide-react";

/* ══════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════ */
interface TravelerBaggage {
  reference: string;
  type: string;
  baggageType: string;
  status: string;
  expiresAt: string | null;
  // TRANSPORT-FEATURE: Transport mode + conditional fields
  transportMode?: string;
  flightNumber: string | null;
  trainNumber?: string | null;
  shipName?: string | null;
  busLineNumber?: string | null;
  destination: string | null;
  agencyName: string | null;
}

interface Traveler {
  name: string;
  whatsapp: string | null;
  email: string | null;
  registeredAt: string;
  expirationDate: string | null;
  status: 'active' | 'expired' | 'pending';
  baggages: TravelerBaggage[];
  totalBaggages: number;
}

interface MarketingStats {
  totalUsers: number;
  activeBaggages: number;
  expiredBaggages: number;
  renewalRate: number;
}

interface MarketingData {
  stats: MarketingStats;
  travelers: Traveler[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

/* ══════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════ */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

function getMailtoUrl(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildRenewalMessage(name: string, reference: string, expiryDate: string): string {
  return `Bonjour ${name}, votre objet QRTags (${reference}) arrive à expiration le ${expiryDate}. Souhaitez-vous le renouveler pour 7€ ?`;
}

function statusBadgeClass(status: string): string {
  if (status === 'active') return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
  if (status === 'expired') return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
  return 'bg-amber-100 dark:bg-blue-900/30 text-amber-800 dark:text-blue-500';
}

function statusBadgeLabel(status: string): string {
  if (status === 'active') return 'Actif';
  if (status === 'expired') return 'Expiré';
  return 'En attente';
}

/* ══════════════════════════════════════════════
   Main Page Component
   ══════════════════════════════════════════════ */
export default function MarketingPage() {
  const [data, setData] = useState<MarketingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Detail modal
  const [selectedTraveler, setSelectedTraveler] = useState<Traveler | null>(null);

  /* ─── Fetch Data ─── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        filter,
        search,
        page: String(page),
        limit: String(limit),
      });
      const res = await fetch(`/api/admin/marketing?${params}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Erreur serveur (${res.status})`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [filter, search, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset page on filter/search change
  useEffect(() => { setPage(1); }, [filter, search]);

  /* ─── Export CSV ─── */
  const statusLabel = (status: string) =>
    status === 'active' ? 'Actif' : status === 'expired' ? 'Expiré' : 'En attente';

  const exportCSV = useCallback(() => {
    if (!data) return;
    const rows = data.travelers.map((t) => [
      t.name,
      t.email || '',
      t.whatsapp || '',
      formatDate(t.registeredAt),
      statusLabel(t.status),
      t.expirationDate ? formatDate(t.expirationDate) : 'N/A',
      t.totalBaggages,
      t.baggages.map((b) => b.reference).join('; '),
      t.baggages.map((b) => b.agencyName || '').filter(Boolean).join('; '),
    ]);

    const header = ['Nom', 'Email', 'WhatsApp', 'Date inscription', 'Statut', 'Date expiration', 'Nb objets', 'Références', 'Agences'];
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qrtagss-marketing-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  /* ─── Search Submit ─── */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  /* ══════════════════════════════════════════════
   RENDER
   ══════════════════════════════════════════════ */
  return (
    <div className="max-w-7xl mx-auto">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Marketing &amp; Relances
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Gérez les utilisateurs et relances de renouvellement
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchData}
            variant="outline"
            className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            onClick={exportCSV}
            variant="outline"
            className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
            disabled={!data || data.pagination.total === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* ─── Error Banner ─── */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4 lg:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Total utilisateurs</p>
                <p className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white mt-1">
                  {data?.stats.totalUsers ?? '—'}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4 lg:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Objets actifs</p>
                <p className="text-2xl lg:text-3xl font-bold text-blue-700 dark:text-blue-500 mt-1">
                  {data?.stats.activeBaggages ?? '—'}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4 lg:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Objets expirés</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl lg:text-3xl font-bold text-red-600 dark:text-red-400 mt-1">
                    {data?.stats.expiredBaggages ?? '—'}
                  </p>
                  {(data?.stats.expiredBaggages ?? 0) > 0 && (
                    <Badge className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-[10px] px-1.5 py-0">
                      Alerte
                    </Badge>
                  )}
                </div>
              </div>
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <ShieldX className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4 lg:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Taux de renouvellement</p>
                <p className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white mt-1">
                  {data?.stats.renewalRate ?? '—'}%
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Filters Bar ─── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            {(['all', 'active', 'expired', 'pending'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-black text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {f === 'all' ? 'Tous' : f === 'active' ? 'Actifs' : f === 'expired' ? 'Expirés' : 'En attente'}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Rechercher par nom, email, réf..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white rounded-xl"
              />
            </div>
            <Button type="submit" variant="outline" className="rounded-xl border-slate-200 dark:border-slate-700">
              Rechercher
            </Button>
          </form>
        </div>
      </div>

      {/* ─── Loading ─── */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {/* ─── Empty State ─── */}
      {!loading && data && data.pagination.total === 0 && (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-lg">Aucun utilisateur trouvé</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            {search ? 'Essayez un autre terme de recherche' : 'Les données apparaîtront une fois les objets activés'}
          </p>
        </div>
      )}

      {/* ─── Desktop Table ─── */}
      {!loading && data && data.pagination.total > 0 && (
        <>
          {/* Desktop (hidden on mobile) */}
          <div className="hidden md:block bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nom</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">WhatsApp</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Inscription</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Statut</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expiration</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {data.travelers.map((traveler) => (
                    <TravelerRow
                      key={`${traveler.name}-${traveler.whatsapp}`}
                      traveler={traveler}
                      onView={() => setSelectedTraveler(traveler)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards (shown only on mobile) */}
          <div className="md:hidden space-y-3">
            {data.travelers.map((traveler) => (
              <TravelerCard
                key={`${traveler.name}-${traveler.whatsapp}`}
                traveler={traveler}
                onView={() => setSelectedTraveler(traveler)}
              />
            ))}
          </div>

          {/* ─── Pagination ─── */}
          {data.pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Page {data.pagination.page} sur {data.pagination.totalPages} — {data.pagination.total} résultat{data.pagination.total > 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-xl border-slate-200 dark:border-slate-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Précédent</span>
                </Button>
                <span className="px-3 py-1 text-sm font-medium bg-slate-100 dark:bg-slate-700 rounded-lg">
                  {page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={page >= data.pagination.totalPages}
                  className="rounded-xl border-slate-200 dark:border-slate-700"
                >
                  <span className="hidden sm:inline mr-1">Suivant</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── Detail Modal ─── */}
      <Dialog open={!!selectedTraveler} onOpenChange={(open) => !open && setSelectedTraveler(null)}>
        <DialogContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">Détails du voyageur</DialogTitle>
          </DialogHeader>
          {selectedTraveler && (
            <DetailModalContent traveler={selectedTraveler} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Table Row Component (Desktop)
   ══════════════════════════════════════════════ */
function TravelerRow({ traveler, onView }: { traveler: Traveler; onView: () => void }) {
  const expiryStr = traveler.expirationDate ? formatDate(traveler.expirationDate) : '—';
  const whatsappMsg = buildRenewalMessage(
    traveler.name.split(' ')[0] || 'voyageur',
    traveler.baggages[0]?.reference || '',
    expiryStr
  );

  const emailBody = buildRenewalMessage(
    traveler.name.split(' ')[0] || 'voyageur',
    traveler.baggages[0]?.reference || '',
    expiryStr
  );
  const mailtoUrl = traveler.email
    ? getMailtoUrl(traveler.email, 'Renouvellement QRTags', emailBody)
    : null;

  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
      <td className="px-5 py-4">
        <div>
          <p className="font-medium text-slate-800 dark:text-white">{traveler.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{traveler.totalBaggages} objet{traveler.totalBaggages > 1 ? 's' : ''}</p>
        </div>
      </td>
      <td className="px-5 py-4">
        {traveler.email ? (
          <a href={mailtoUrl!} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            {traveler.email}
          </a>
        ) : (
          <span className="text-sm text-slate-400">—</span>
        )}
      </td>
      <td className="px-5 py-4">
        <span className="text-sm text-slate-600 dark:text-slate-300 font-mono">
          {traveler.whatsapp || '—'}
        </span>
      </td>
      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
        {formatDate(traveler.registeredAt)}
      </td>
      <td className="px-5 py-4">
        <Badge className={statusBadgeClass(traveler.status)}>
          {statusBadgeLabel(traveler.status)}
        </Badge>
      </td>
      <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
        {expiryStr}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-1.5">
          {traveler.whatsapp && (
            <a
              href={getWhatsAppUrl(traveler.whatsapp, whatsappMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
              title="Envoyer un WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
          )}
          {mailtoUrl && (
            <a
              href={mailtoUrl}
              className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              title="Envoyer un Email"
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
          <button
            onClick={onView}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
            title="Voir détails"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ══════════════════════════════════════════════
   Card Component (Mobile)
   ══════════════════════════════════════════════ */
function TravelerCard({ traveler, onView }: { traveler: Traveler; onView: () => void }) {
  const expiryStr = traveler.expirationDate ? formatDate(traveler.expirationDate) : '—';
  const whatsappMsg = buildRenewalMessage(
    traveler.name.split(' ')[0] || 'voyageur',
    traveler.baggages[0]?.reference || '',
    expiryStr
  );
  const emailBody = buildRenewalMessage(
    traveler.name.split(' ')[0] || 'voyageur',
    traveler.baggages[0]?.reference || '',
    expiryStr
  );
  const mailtoUrl = traveler.email
    ? getMailtoUrl(traveler.email, 'Renouvellement QRTags', emailBody)
    : null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
      {/* Top: Name + Status */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-slate-800 dark:text-white">{traveler.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{traveler.totalBaggages} objet{traveler.totalBaggages > 1 ? 's' : ''}</p>
        </div>
        <Badge className={statusBadgeClass(traveler.status)}>
          {statusBadgeLabel(traveler.status)}
        </Badge>
      </div>

      {/* Info */}
      <div className="space-y-1.5 mb-4 text-sm">
        {traveler.email && (
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{traveler.email}</span>
          </div>
        )}
        {traveler.whatsapp && (
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono">{traveler.whatsapp}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <CalendarDays className="w-3.5 h-3.5" />
          Inscription : {formatDate(traveler.registeredAt)}
        </div>
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          Expiration : {expiryStr}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
        {traveler.whatsapp && (
          <a
            href={getWhatsAppUrl(traveler.whatsapp, whatsappMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        )}
        {mailtoUrl && (
          <a
            href={mailtoUrl}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Mail className="w-4 h-4" />
            Email
          </a>
        )}
        <button
          onClick={onView}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition-colors"
        >
          <Eye className="w-4 h-4" />
          Détails
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Detail Modal Content
   ══════════════════════════════════════════════ */
function DetailModalContent({ traveler }: { traveler: Traveler }) {
  const expiryStr = traveler.expirationDate ? formatDate(traveler.expirationDate) : '—';
  const whatsappMsg = buildRenewalMessage(
    traveler.name.split(' ')[0] || 'voyageur',
    traveler.baggages[0]?.reference || '',
    expiryStr
  );
  const emailBody = buildRenewalMessage(
    traveler.name.split(' ')[0] || 'voyageur',
    traveler.baggages[0]?.reference || '',
    expiryStr
  );
  const mailtoUrl = traveler.email
    ? getMailtoUrl(traveler.email, 'Renouvellement QRTags', emailBody)
    : null;

  return (
    <div className="space-y-5 mt-2">
      {/* Traveler Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nom</p>
          <p className="font-medium text-slate-800 dark:text-white">{traveler.name}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</p>
          {traveler.email ? (
            <a href={mailtoUrl!} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">{traveler.email}</a>
          ) : (
            <p className="font-medium text-slate-400">—</p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">WhatsApp</p>
          <p className="font-medium text-slate-800 dark:text-white font-mono">{traveler.whatsapp || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Inscription</p>
          <p className="font-medium text-slate-800 dark:text-white">{formatDate(traveler.registeredAt)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Statut</p>
          <Badge className={statusBadgeClass(traveler.status)}>
            {statusBadgeLabel(traveler.status)}
          </Badge>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Expiration</p>
          <p className="font-medium text-slate-800 dark:text-white">{expiryStr}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nb objets</p>
          <p className="font-medium text-slate-800 dark:text-white">{traveler.totalBaggages}</p>
        </div>
      </div>

      {/* Baggages List */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Objets</p>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {traveler.baggages.map((b) => (
            <div key={b.reference} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-sm font-semibold text-slate-800 dark:text-white">{b.reference}</span>
                <Badge variant="outline" className="text-[10px] px-2 py-0">
                  {b.type === 'hajj' ? 'Hajj' : 'Voyageur'}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                {/* TRANSPORT-FEATURE: Dynamic transport info */}
                {b.transportMode === 'flight' && b.flightNumber && (
                  <span className="flex items-center gap-1"><Plane className="w-3 h-3" />{b.flightNumber}</span>
                )}
                {b.transportMode === 'train' && b.trainNumber && (
                  <span className="flex items-center gap-1">🚆 {b.trainNumber}</span>
                )}
                {b.transportMode === 'boat' && b.shipName && (
                  <span className="flex items-center gap-1">🚢 {b.shipName}</span>
                )}
                {b.transportMode === 'bus' && b.busLineNumber && (
                  <span className="flex items-center gap-1">🚌 {b.busLineNumber}</span>
                )}
                {!b.transportMode && b.flightNumber && (
                  <span className="flex items-center gap-1"><Plane className="w-3 h-3" />{b.flightNumber}</span>
                )}
                {b.destination && (
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.destination}</span>
                )}
                <span className="flex items-center gap-1"><Luggage className="w-3 h-3" />{b.baggageType}</span>
                {b.agencyName && (
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{b.agencyName}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {traveler.whatsapp && (
          <a
            href={getWhatsAppUrl(traveler.whatsapp, whatsappMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            WhatsApp
          </a>
        )}
        {mailtoUrl ? (
          <a
            href={mailtoUrl}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
          >
            <Mail className="w-5 h-5" />
            Email
          </a>
        ) : (
          <button
            onClick={() => {
              window.location.href = getMailtoUrl('contact@qrtags.com', 'Renouvellement QRTags', emailBody);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
          >
            <Mail className="w-5 h-5" />
            Email
          </button>
        )}
      </div>
    </div>
  );
}
