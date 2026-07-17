'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  CheckCircle,
  Users,
  Building,
  CreditCard,
  Search,
  RefreshCw,
  PlusCircle,
  Eye,
  Package,
  DollarSign,
} from "lucide-react";

// Types
interface DashboardStats {
  totalTags: number;
  activeTags: number;
  foundItems: number;
  activeAgencies: number;
  monthlyRevenue: number;
  scansThisMonth: number;
  tagsByType: Record<string, number>;
}

interface RecentActivity {
  id: string;
  type: 'scan' | 'tag_generated' | 'agency_registered';
  name: string;
  reference: string;
  time: string;
  details: string;
  status: 'success' | 'warning' | 'info';
  agency?: string;
}

interface DailyScan {
  day: string;
  count: number;
}

// Modern Stat Card Component
function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  iconBg
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: { value: number; isUp: boolean };
  iconBg: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:shadow-lg hover:shadow-emerald-200/50 dark:hover:shadow-emerald-900/20 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trend.isUp ? 'text-emerald-600' : 'text-rose-500'}`}>
            {trend.isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">{title}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

// Quick Actions Component
function QuickActions() {
  const actions = [
    { label: "Générer des tags", icon: <PlusCircle className="w-5 h-5" />, href: "/admin/generer", color: "bg-emerald-500" },
    { label: "Tags / QR Codes", icon: <QrCode className="w-5 h-5" />, href: "/admin/etiquettes", color: "bg-emerald-600" },
    { label: "Objets trouvés", icon: <Search className="w-5 h-5" />, href: "/admin/trouvailles", color: "bg-amber-500" },
    { label: "Agences", icon: <Building className="w-5 h-5" />, href: "/admin/agences", color: "bg-teal-500" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <Link
          key={index}
          href={action.href}
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-all duration-300 group"
        >
          <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform`}>
            {action.icon}
          </div>
          <span className="font-medium text-slate-700 dark:text-slate-200">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}

// Chart Component
function ScansChart({ data }: { data: DailyScan[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Scans ce mois</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Total: {total} scans cette semaine</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-600/10 rounded-lg">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span className="text-xs text-slate-600 dark:text-slate-300">Scans</span>
        </div>
      </div>

      <div className="h-48 flex items-end gap-3">
        {data.map((item, index) => {
          const isHovered = hoveredIndex === index;
          const height = item.count > 0 ? Math.max((item.count / maxCount) * 100, 8) : 8;

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center relative"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {isHovered && item.count > 0 && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 dark:bg-slate-700 text-white text-xs px-2 py-1 rounded-lg shadow-lg whitespace-nowrap z-10">
                  {item.count} scan{item.count > 1 ? 's' : ''}
                </div>
              )}

              <div className="w-full flex flex-col items-center justify-end h-40">
                <div
                  className={`w-full max-w-[40px] rounded-t-lg transition-all duration-300 cursor-pointer ${
                    item.count > 0
                      ? 'bg-emerald-500'
                      : 'bg-slate-200 dark:bg-slate-700'
                  } ${isHovered && item.count > 0 ? 'opacity-80' : ''}`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <div className="text-xs mt-2 text-slate-500 dark:text-slate-400">{item.day}</div>
              <div className={`text-xs font-semibold ${item.count > 0 ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
                {item.count || '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Tags by Type Chart
function TagsByTypeChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(e => e[1]), 1);
  const colors = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

  const typeLabels: Record<string, string> = {
    hotel: 'Hôtel',
    bus: 'Bus',
    school: 'École',
    clinic: 'Clinique',
    car_rental: 'Location auto',
    luggage_storage: 'Consigne',
    enterprise: 'Entreprise',
    event: 'Événement',
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Tags par type d&apos;agence</h3>
      <div className="space-y-4">
        {entries.map(([type, count], i) => (
          <div key={type} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">{typeLabels[type] || type}</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-white">{count}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max((count / max) * 100, 2)}%`,
                  backgroundColor: colors[i % colors.length]
                }}
              />
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">Aucune donnée disponible</p>
        )}
      </div>
    </div>
  );
}

// Activity Item Component
function ActivityItem({ activity }: { activity: RecentActivity }) {
  const statusConfig = {
    success: { bg: 'bg-emerald-100 dark:bg-emerald-600/10', icon: <CheckCircle className="w-4 h-4 text-emerald-600" /> },
    warning: { bg: 'bg-amber-100 dark:bg-amber-600/10', icon: <Clock className="w-4 h-4 text-amber-600" /> },
    info: { bg: 'bg-blue-100 dark:bg-blue-500/10', icon: <Package className="w-4 h-4 text-blue-500" /> }
  };

  const config = statusConfig[activity.status];

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bg}`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-medium text-slate-800 dark:text-white">{activity.name}</p>
          <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{activity.details}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {activity.time}
          </span>
          {activity.agency && (
            <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
              {activity.agency}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Recent Activity Component
function RecentActivityList({ activities }: { activities: RecentActivity[] }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Activité récente</h3>
        <Link href="/admin/trouvailles" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
          Voir tout <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Aucune activité récente</p>
          </div>
        ) : (
          activities.slice(0, 5).map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        )}
      </div>
    </div>
  );
}

// Main Dashboard Page
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTags: 0,
    activeTags: 0,
    foundItems: 0,
    activeAgencies: 0,
    monthlyRevenue: 0,
    scansThisMonth: 0,
    tagsByType: {},
  });
  const [dailyScans, setDailyScans] = useState<DailyScan[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || stats);
        setDailyScans(data.dailyScans || generateDefaultScans());
        setRecentActivities(data.recentActivities || []);
      } else {
        setDailyScans(generateDefaultScans());
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDailyScans(generateDefaultScans());
    } finally {
      setLoading(false);
    }
  };

  const generateDefaultScans = (): DailyScan[] => {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    return days.map(day => ({ day, count: 0 }));
  };

  const statCards = [
    {
      title: 'Tags actifs',
      value: stats.activeTags,
      subtitle: `sur ${stats.totalTags} total`,
      icon: <QrCode className="w-6 h-6 text-white" />,
      iconBg: 'bg-emerald-500',
      trend: stats.totalTags > 0 ? { value: Math.round((stats.activeTags / stats.totalTags) * 100), isUp: true } : undefined,
    },
    {
      title: 'Objets retrouvés',
      value: stats.foundItems,
      subtitle: 'Retour à propriétaire',
      icon: <Eye className="w-6 h-6 text-white" />,
      iconBg: 'bg-amber-500',
    },
    {
      title: 'Agences actives',
      value: stats.activeAgencies,
      subtitle: 'Sur la plateforme',
      icon: <Building className="w-6 h-6 text-white" />,
      iconBg: 'bg-teal-500',
    },
    {
      title: 'Revenus mensuels',
      value: `${Math.round(stats.monthlyRevenue).toLocaleString('fr-FR')} FCFA`,
      subtitle: 'Ce mois-ci',
      icon: <DollarSign className="w-6 h-6 text-white" />,
      iconBg: 'bg-emerald-600',
    },
    {
      title: 'Scans ce mois',
      value: stats.scansThisMonth,
      subtitle: 'Tous types confondus',
      icon: <Search className="w-6 h-6 text-white" />,
      iconBg: 'bg-blue-500',
    },
    {
      title: 'Taux de restitution',
      value: stats.activeTags > 0 ? `${Math.round((stats.foundItems / Math.max(stats.activeTags, 1)) * 100)}%` : '—',
      subtitle: 'Objets retrouvés / perdus',
      icon: <CheckCircle className="w-6 h-6 text-white" />,
      iconBg: 'bg-green-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tableau de bord</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Vue d&apos;ensemble de votre activité QRTags</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <QuickActions />
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-slate-200 dark:bg-slate-700 rounded-2xl p-6 h-40 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {statCards.map((card, index) => (
            <StatCard key={index} {...card} />
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {loading ? (
          <>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 animate-pulse h-80 lg:col-span-2"></div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 animate-pulse h-80"></div>
          </>
        ) : (
          <>
            <ScansChart data={dailyScans} />
            <TagsByTypeChart data={stats.tagsByType} />
          </>
        )}
      </div>

      {/* Recent Activity */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 animate-pulse h-80"></div>
      ) : (
        <RecentActivityList activities={recentActivities} />
      )}
    </div>
  );
}
