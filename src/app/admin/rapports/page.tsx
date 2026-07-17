'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Download,
  Luggage,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  QrCode,
  Plane,
  Calendar,
  UserCheck,
  Phone
} from 'lucide-react';

interface Stats {
  total: number;
  pending_activation: number;
  active: number;
  scanned: number;
  lost: number;
  found: number;
  blocked: number;
  hajj: number;
  voyageur: number;
  withFounder: number;
}

interface DailyStat {
  date: string;
  count: number;
  label: string;
}

interface WeeklyStat {
  week: number;
  count: number;
  label: string;
}

interface FounderBaggage {
  id: string;
  reference: string;
  status: string;
  founderName: string | null;
  founderPhone: string | null;
  founderAt: string | null;
  travelerName: string;
  agencyName: string;
  lastScanDate: string | null;
}

interface ReportData {
  stats: Stats;
  recoveryRate: number;
  dailyStats: DailyStat[];
  weeklyStats: WeeklyStat[];
  scanLogsCount: number;
  period: string;
  founderBaggages: FounderBaggage[];
}

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    fetchReports();
  }, [period]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?period=${period}&founders=true`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv') => {
    window.open(`/api/reports/export?period=${period}`, '_blank');
  };

  // Calculate max for chart
  const maxDaily = data?.dailyStats ? Math.max(...data.dailyStats.map(d => d.count), 1) : 1;
  const maxWeekly = data?.weeklyStats ? Math.max(...data.weeklyStats.map(d => d.count), 1) : 1;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Rapports</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Statistiques et analyses de l&apos;activité</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            <option value="week">7 derniers jours</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
          
          {/* Export Button */}
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Main Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Luggage className="w-5 h-5 text-blue-500" />
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-sm">Total bagages</span>
              </div>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{data.stats.total}</p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-blue-600/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-sm">Actifs</span>
              </div>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{data.stats.active}</p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-blue-600/20 rounded-xl flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-sm">Scannés</span>
              </div>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{data.stats.scanned}</p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-rose-100 dark:bg-rose-500/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                </div>
                <span className="text-slate-500 dark:text-slate-400 text-sm">Perdus</span>
              </div>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{data.stats.lost}</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Daily Evolution Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#2563EB]" />
                Évolution quotidienne
              </h3>
              <div className="space-y-3">
                {data.dailyStats.map((day, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-sm text-slate-500 dark:text-slate-400 w-20">{day.label}</span>
                    <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#2563EB] to-[#ff9f00] rounded-full transition-all duration-500"
                        style={{ width: `${(day.count / maxDaily) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-800 dark:text-white w-8 text-right">{day.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Evolution Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#2563EB]" />
                Évolution hebdomadaire
              </h3>
              <div className="space-y-3">
                {data.weeklyStats.map((week, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-sm text-slate-500 dark:text-slate-400 w-24">{week.label}</span>
                    <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${(week.count / maxWeekly) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-800 dark:text-white w-8 text-right">{week.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Status Distribution */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Répartition par statut</h3>
              <div className="space-y-3">
                <StatusRow label="En attente" count={data.stats.pending_activation} total={data.stats.total} color="amber" />
                <StatusRow label="Actifs" count={data.stats.active} total={data.stats.total} color="emerald" />
                <StatusRow label="Scannés" count={data.stats.scanned} total={data.stats.total} color="blue" />
                <StatusRow label="Perdus" count={data.stats.lost} total={data.stats.total} color="rose" />
                <StatusRow label="Retrouvés" count={data.stats.found} total={data.stats.total} color="green" />
                <StatusRow label="Bloqués" count={data.stats.blocked} total={data.stats.total} color="slate" />
              </div>
            </div>

            {/* Type Distribution */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Par type</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-blue-600/10 rounded-xl">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                    <Plane className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Hajj</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{data.stats.hajj}</p>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">
                    {data.stats.total > 0 ? Math.round((data.stats.hajj / data.stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-blue-600/10 rounded-xl">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                    <Luggage className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Voyageur</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white">{data.stats.voyageur}</p>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">
                    {data.stats.total > 0 ? Math.round((data.stats.voyageur / data.stats.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Indicateurs clés</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">Taux de récupération</span>
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{data.recoveryRate}%</p>
                  <p className="text-xs text-slate-400 mt-1">Bagages retrouvés / perdus</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">Scans enregistrés</span>
                    <QrCode className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <p className="text-3xl font-bold text-[#2563EB]">{data.scanLogsCount}</p>
                  <p className="text-xs text-slate-400 mt-1">Total sur la période</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">Avec trouveur</span>
                    <UserCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{data.stats.withFounder || 0}</p>
                  <p className="text-xs text-slate-400 mt-1">Infos trouveur enregistrées</p>
                </div>
              </div>
            </div>
          </div>

          {/* Founders Waiting Section */}
          {data.founderBaggages && data.founderBaggages.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-blue-600/20 rounded-xl flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Trouveurs en attente</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Bagages trouvés par un trouveur, en attente de confirmation</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-100 dark:bg-blue-600/20 text-amber-600 dark:text-blue-500 rounded-full text-sm font-medium">
                  {data.founderBaggages.length} en attente
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.founderBaggages.map((baggage) => (
                  <div
                    key={baggage.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono font-semibold text-slate-800 dark:text-white text-sm">{baggage.reference}</span>
                      {baggage.founderAt && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {new Date(baggage.founderAt).toLocaleDateString('fr-FR')}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400 dark:text-slate-500 w-16 shrink-0 text-xs">Voyageur</span>
                        <span className="truncate">{baggage.travelerName || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-800 dark:text-white">
                        <UserCheck className="w-3 h-3 text-blue-600 shrink-0" />
                        <span className="font-medium text-sm">{baggage.founderName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400 dark:text-slate-500 w-16 shrink-0 text-xs">Agence</span>
                        <span className="truncate">{baggage.agencyName}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                      {baggage.founderPhone && (
                        <a
                          href={`https://wa.me/${baggage.founderPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-medium transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          WhatsApp
                        </a>
                      )}
                      <Link
                        href={`/admin/baggage/${baggage.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors"
                      >
                        Détails
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500">
          Aucune donnée disponible
        </div>
      )}
    </div>
  );
}

// Status Row Component
function StatusRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const colorClasses: Record<string, string> = {
    amber: 'bg-blue-600',
    emerald: 'bg-blue-600',
    blue: 'bg-blue-500',
    rose: 'bg-rose-500',
    green: 'bg-green-500',
    slate: 'bg-slate-400',
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-500 dark:text-slate-400 w-24">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClasses[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-slate-800 dark:text-white w-8 text-right">{count}</span>
    </div>
  );
}
