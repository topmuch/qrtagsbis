'use client';

import { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  QrCode,
  Tag,
  Calendar,
  Share2,
  BarChart3,
  MapPin
} from 'lucide-react';
import { useAgency } from '../layout';

interface Stats {
  total: number;
  created: number;
  activated: number;
  scanned: number;
  lost: number;
  found: number;
  blocked: number;
}

interface DailyStat {
  date: string;
  count: number;
  label: string;
}

interface ReportData {
  stats: Stats;
  recoveryRate: number;
  dailyStats: DailyStat[];
  weeklyStats: DailyStat[];
  scanLogsCount: number;
  period: string;
  scansByLocation: { location: string; count: number }[];
}

export default function AgencyReportsPage() {
  const { agencyId, agencyName, agencyData } = useAgency();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    fetchReports();
  }, [period, agencyId]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?period=${period}&agencyId=${agencyId}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    window.open(`/api/reports/export?agencyId=${agencyId}&period=${period}`, '_blank');
  };

  const handleSharePublicPage = () => {
    const slug = agencyData?.slug || 'agency';
    const url = `${window.location.origin}/agency/${slug}`;
    navigator.clipboard.writeText(url);
    alert(`Lien copié ! ${url}`);
  };

  const maxDaily = data?.dailyStats ? Math.max(...data.dailyStats.map(d => d.count), 1) : 1;
  const maxWeekly = data?.weeklyStats ? Math.max(...data.weeklyStats.map(d => d.count), 1) : 1;

  const lostVsFoundRate = data && data.stats.lost > 0
    ? Math.round((data.stats.found / data.stats.lost) * 100)
    : 0;

  // Mock scans by location for demo
  const scansByLocation = data?.scansByLocation || [
    { location: 'Réception', count: 45 },
    { location: 'Restaurant', count: 23 },
    { location: 'Parking', count: 12 },
    { location: 'Chambre', count: 8 },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Rapports</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Statistiques de {agencyName}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
          >
            <option value="week">7 derniers jours</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
          <button
            onClick={handleSharePublicPage}
            className="flex items-center gap-2 px-4 py-2 bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] rounded-xl text-sm font-medium transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Partager
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Main Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-[#10B981] to-[#059669] p-5 rounded-2xl text-white">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <p className="text-3xl font-bold">{data.stats.total}</p>
              <p className="text-sm text-white/80">Total tags</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 rounded-2xl text-white">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-3xl font-bold">{data.stats.activated}</p>
              <p className="text-sm text-white/80">Actifs</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-5 rounded-2xl text-white">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <p className="text-3xl font-bold">{data.stats.scanned}</p>
              <p className="text-sm text-white/80">Scannés</p>
            </div>
            <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-5 rounded-2xl text-white">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <p className="text-3xl font-bold">{data.stats.lost}</p>
              <p className="text-sm text-white/80">Perdus</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Daily Evolution Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#10B981]" />
                Évolution quotidienne
              </h3>
              <div className="space-y-3">
                {data.dailyStats.map((day, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-sm text-slate-500 dark:text-slate-400 w-20">{day.label}</span>
                    <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#10B981] to-[#F59E0B] rounded-full transition-all duration-500"
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
                <TrendingUp className="w-5 h-5 text-[#10B981]" />
                Évolution hebdomadaire
              </h3>
              <div className="space-y-3">
                {data.weeklyStats.map((week, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-sm text-slate-500 dark:text-slate-400 w-24">{week.label}</span>
                    <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#10B981] to-[#059669] rounded-full transition-all duration-500"
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
                <StatusRow label="Créé" count={data.stats.created} total={data.stats.total} color="bg-gray-500" />
                <StatusRow label="Activé" count={data.stats.activated} total={data.stats.total} color="bg-[#10B981]" />
                <StatusRow label="Scanné" count={data.stats.scanned} total={data.stats.total} color="bg-blue-500" />
                <StatusRow label="Perdu" count={data.stats.lost} total={data.stats.total} color="bg-rose-500" />
                <StatusRow label="Retrouvé" count={data.stats.found} total={data.stats.total} color="bg-green-500" />
              </div>
            </div>

            {/* Scans by Location */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#10B981]" />
                Scans par lieu
              </h3>
              <div className="space-y-3">
                {scansByLocation.map((loc, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-[#10B981]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{loc.location}</p>
                      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1">
                        <div
                          className="h-full bg-[#10B981] rounded-full"
                          style={{ width: `${Math.max((loc.count / Math.max(...scansByLocation.map(l => l.count), 1)) * 100, 5)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{loc.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Indicateurs clés</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">Taux de restitution</span>
                    <TrendingUp className="w-4 h-4 text-[#10B981]" />
                  </div>
                  <p className="text-3xl font-bold text-[#10B981]">{lostVsFoundRate}%</p>
                  <p className="text-xs text-slate-400 mt-1">Objets retrouvés / perdus</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">Scans enregistrés</span>
                    <QrCode className="w-4 h-4 text-[#F59E0B]" />
                  </div>
                  <p className="text-3xl font-bold text-[#F59E0B]">{data.scanLogsCount}</p>
                  <p className="text-xs text-slate-400 mt-1">Total sur la période</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-500 dark:text-slate-400 text-sm">Objets perdus vs retrouvés</span>
                    <BarChart3 className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-rose-500">{data.stats.lost}</p>
                      <p className="text-xs text-slate-400">Perdus</p>
                    </div>
                    <div className="text-slate-300">→</div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#10B981]">{data.stats.found}</p>
                      <p className="text-xs text-slate-400">Retrouvés</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Public Page Info */}
          <div className="bg-gradient-to-r from-[#10B981]/10 to-[#F59E0B]/10 rounded-2xl p-6 border border-[#10B981]/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#10B981]/20 rounded-xl flex items-center justify-center">
                <Share2 className="w-6 h-6 text-[#10B981]" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                  Page publique de votre agence
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">
                  Partagez ce lien avec vos clients pour leur montrer les objets que vous protégez :
                </p>
                <code className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg text-sm text-[#10B981] border border-slate-200 dark:border-slate-700">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/agency/{agencyData?.slug || 'agency'}
                </code>
              </div>
              <button
                onClick={handleSharePublicPage}
                className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-sm font-medium transition-colors"
              >
                Copier le lien
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500">Aucune donnée disponible</div>
      )}
    </div>
  );
}

function StatusRow({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-500 dark:text-slate-400 w-24">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-slate-800 dark:text-white w-8 text-right">{count}</span>
    </div>
  );
}
