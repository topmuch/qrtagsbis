'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Search,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle,
  MapPin,
  X,
  Tag,
  Send,
  TrendingUp,
  ArrowUpRight,
  Users,
  Sparkles,
  RefreshCw,
  Plus,
  Zap,
  BarChart3
} from "lucide-react";
import { useAgency } from '../layout';
import { isActive, isPending, isLost, isFound, normalizeStatus } from '@/lib/status';

interface TagItem {
  id: string;
  serialNumber: string;
  type: string;
  ownerName: string | null;
  ownerPhone: string | null;
  itemName: string | null;
  itemCategory: string | null;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  lastScanDate: string | null;
  lastLocation: string | null;
  founderName: string | null;
  founderPhone: string | null;
  founderAt: string | null;
}

interface Stats {
  total: number;
  pending: number;
  active: number;
  scanned: number;
  lost: number;
  found: number;
}

// Modern Stat Card Component
function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  trend
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: { value: number; isUp: boolean };
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
            <TrendingUp className={`w-3 h-3 ${trend.isUp ? '' : 'rotate-180'}`} />
            {trend.value}%
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-slate-800 dark:text-white">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { agencyId, agencyName } = useAgency();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, active: 0, scanned: 0, lost: 0, found: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [agencyId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ agencyId });
      const response = await fetch(`/api/agency/tags?${params}`);
      const data = await response.json();

      const tagList: TagItem[] = (data.tags || []).map((t: Record<string, unknown>) => ({
        id: t.id as string,
        serialNumber: (t.serialNumber || t.reference || '') as string,
        type: (t.type || '') as string,
        ownerName: (t.ownerName || t.travelerFirstName || null) as string | null,
        ownerPhone: (t.ownerPhone || t.whatsappOwner || null) as string | null,
        itemName: (t.itemName || null) as string | null,
        itemCategory: (t.itemCategory || null) as string | null,
        status: normalizeStatus((t.status || 'created') as string),
        createdAt: (t.createdAt || '') as string,
        expiresAt: (t.expiresAt || null) as string | null,
        lastScanDate: (t.lastScanDate || null) as string | null,
        lastLocation: (t.lastLocation || null) as string | null,
        founderName: (t.founderName || null) as string | null,
        founderPhone: (t.founderPhone || null) as string | null,
        founderAt: (t.founderAt || null) as string | null,
      }));

      setTags(tagList);
      setStats(data.stats || {
        total: tagList.length,
        pending: tagList.filter(t => isPending(t.status)).length,
        active: tagList.filter(t => isActive(t.status)).length,
        scanned: tagList.filter(t => t.status === 'scanned').length,
        lost: tagList.filter(t => isLost(t.status)).length,
        found: tagList.filter(t => isFound(t.status)).length,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTags = tags.filter(t =>
    t.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
    (t.ownerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.itemName || '').toLowerCase().includes(search.toLowerCase())
  );

  const recentTags = filteredTags.slice(0, 5);
  const lostTags = filteredTags.filter(t => isLost(t.status));
  const foundTags = filteredTags.filter(t => isFound(t.status));

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const s = normalizeStatus(status);
    const map: Record<string, { label: string; classes: string }> = {
      created: { label: 'Créé', classes: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
      activated: { label: 'Activé', classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
      scanned: { label: 'Scanné', classes: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      lost: { label: 'Perdu', classes: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
      found: { label: 'Retrouvé', classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      blocked: { label: 'Bloqué', classes: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
      expired: { label: 'Expiré', classes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    };
    const info = map[s] || map.created;
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${info.classes}`}>{info.label}</span>;
  };

  const recoveryRate = stats.lost > 0 ? Math.round((stats.found / stats.lost) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Tableau de bord
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Bienvenue, {agencyName} — Vue d&apos;ensemble de vos tags
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/agence/activations"
            className="flex items-center gap-2 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Activer un tag
          </Link>
          <button
            onClick={fetchDashboardData}
            className="p-2 text-slate-500 hover:text-[#10B981] hover:bg-[#10B981]/10 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Tags actifs"
          value={stats.active}
          subtitle={`${stats.total} tags au total`}
          icon={<QrCode className="w-6 h-6 text-emerald-600" />}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          trend={{ value: 12, isUp: true }}
        />
        <StatCard
          title="Objets perdus"
          value={stats.lost}
          subtitle="À retrouver"
          icon={<AlertTriangle className="w-6 h-6 text-rose-600" />}
          iconBg="bg-rose-100 dark:bg-rose-900/30"
        />
        <StatCard
          title="Objets retrouvés"
          value={stats.found}
          subtitle={`Taux: ${recoveryRate}%`}
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          iconBg="bg-green-100 dark:bg-green-900/30"
          trend={{ value: 8, isUp: true }}
        />
        <StatCard
          title="Scans ce mois"
          value={stats.scanned}
          subtitle="Derniers 30 jours"
          icon={<Zap className="w-6 h-6 text-amber-600" />}
          iconBg="bg-amber-100 dark:bg-amber-900/30"
          trend={{ value: 15, isUp: true }}
        />
      </div>

      {/* Alert Banner for Lost Tags */}
      {lostTags.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <p className="text-rose-700 dark:text-rose-400 font-medium">Attention !</p>
            <p className="text-rose-600 dark:text-rose-300 text-sm">Vous avez {lostTags.length} objet(s) signalé(s) comme perdu(s).</p>
          </div>
          <Link
            href="/agence/perdus"
            className="ml-auto px-3 py-1.5 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors shrink-0"
          >
            Voir les perdus
          </Link>
        </div>
      )}

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Tags */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#10B981]" />
              Tags récents
            </h2>
            <Link href="/agence/baggages" className="text-sm text-[#10B981] hover:underline flex items-center gap-1">
              Voir tout <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Search */}
          <div className="px-6 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par N° série, propriétaire, objet..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-6 py-3 text-slate-500 dark:text-slate-400 font-medium text-xs">N° Série</th>
                  <th className="text-left px-6 py-3 text-slate-500 dark:text-slate-400 font-medium text-xs">Objet</th>
                  <th className="text-left px-6 py-3 text-slate-500 dark:text-slate-400 font-medium text-xs hidden md:table-cell">Propriétaire</th>
                  <th className="text-left px-6 py-3 text-slate-500 dark:text-slate-400 font-medium text-xs">Statut</th>
                  <th className="text-left px-6 py-3 text-slate-500 dark:text-slate-400 font-medium text-xs hidden lg:table-cell">Dernier scan</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-6 h-6 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
                        <span className="text-slate-500">Chargement...</span>
                      </div>
                    </td>
                  </tr>
                ) : recentTags.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                          <QrCode className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400">Aucun tag trouvé</p>
                        <Link href="/agence/activations" className="text-sm text-[#10B981] hover:underline mt-2">Activer votre premier tag</Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentTags.map((tag) => (
                    <tr key={tag.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                            <QrCode className="w-4 h-4 text-[#10B981]" />
                          </div>
                          <span className="text-slate-800 dark:text-white font-mono text-sm font-medium">
                            {tag.serialNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-700 dark:text-slate-200 text-sm">
                          {tag.itemName || <span className="text-slate-400 italic">Non renseigné</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-slate-700 dark:text-slate-200 text-sm">
                          {tag.ownerName || <span className="text-slate-400 italic">Non assigné</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(tag.status)}
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(tag.lastScanDate)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recovery Rate Card */}
          <div className="bg-gradient-to-br from-[#10B981] to-[#059669] rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5" />
              <h3 className="font-semibold">Taux de restitution</h3>
            </div>
            <p className="text-5xl font-bold mb-2">{recoveryRate}%</p>
            <p className="text-white/70 text-sm">
              {stats.found} retrouvé(s) sur {stats.lost} perdu(s)
            </p>
            <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${Math.min(recoveryRate, 100)}%` }}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Actions rapides</h3>
            <div className="space-y-2">
              <Link
                href="/agence/activations"
                className="flex items-center gap-3 p-3 rounded-xl bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm font-medium">Activer un tag</span>
              </Link>
              <Link
                href="/agence/perdus"
                className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
              >
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-medium">Déclarer un objet perdu</span>
              </Link>
              <Link
                href="/agence/trouvailles"
                className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Marquer comme trouvé</span>
              </Link>
              <Link
                href="/agence/rapports"
                className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 transition-colors"
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm font-medium">Voir les rapports</span>
              </Link>
            </div>
          </div>

          {/* Found Tags Summary */}
          {foundTags.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-800 dark:text-green-400">Récemment retrouvés</h3>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {foundTags.slice(0, 5).map(tag => (
                  <div key={tag.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-200 font-mono">{tag.serialNumber}</span>
                    <span className="text-green-600 text-xs">{tag.itemName || 'Objet'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
