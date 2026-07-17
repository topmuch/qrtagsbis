'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCard,
  RefreshCw,
  Search,
  ArrowUpRight,
  XCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

// Types
interface Subscription {
  id: string;
  agencyId: string;
  agency: { id: string; name: string; agencyType?: { name: string; label: string } | null };
  plan: string;
  status: string;
  startDate: string;
  endDate: string | null;
  amount: number;
  currency: string;
  billingCycle: string;
  maxTags: number;
  maxUsers: number;
  createdAt: string;
}

const PLAN_CONFIG: Record<string, { label: string; className: string }> = {
  starter: { label: 'Starter', className: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
  pro: { label: 'Pro', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  enterprise: { label: 'Enterprise', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  trial: { label: 'Essai', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  active: { label: 'Active', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  past_due: { label: 'En retard', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  expired: { label: 'Expirée', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' },
};

export default function AbonnementsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchSubscriptions();
  }, [planFilter, statusFilter]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (planFilter !== 'all') params.set('plan', planFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/subscriptions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (subId: string) => {
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: subId, action: 'renew' }),
      });
      if (res.ok) fetchSubscriptions();
    } catch (error) {
      console.error('Error renewing subscription:', error);
    }
  };

  const handleUpgrade = async (subId: string, plan: string) => {
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: subId, action: 'upgrade', plan }),
      });
      if (res.ok) fetchSubscriptions();
    } catch (error) {
      console.error('Error upgrading subscription:', error);
    }
  };

  const handleCancel = async (subId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cet abonnement ?')) return;
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: subId, action: 'cancel' }),
      });
      if (res.ok) fetchSubscriptions();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const filteredSubs = subscriptions.filter(sub =>
    !search || sub.agency.name.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    trial: subscriptions.filter(s => s.status === 'trial').length,
    pastDue: subscriptions.filter(s => s.status === 'past_due').length,
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestion des Abonnements</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Suivez et gérez les abonnements des agences</p>
        </div>
        <Button
          onClick={fetchSubscriptions}
          variant="outline"
          className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Actifs</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">En essai</p>
                <p className="text-2xl font-bold text-blue-600">{stats.trial}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">En retard</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pastDue}</p>
              </div>
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <XCircle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par agence..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full lg:w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                <SelectValue placeholder="Par plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les plans</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                <SelectValue placeholder="Par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="trial">Essai</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="past_due">En retard</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
                <SelectItem value="expired">Expirée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 mt-3">Chargement...</p>
        </div>
      ) : filteredSubs.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Aucun abonnement trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-700">
                  <TableHead>Agence</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubs.map((sub) => {
                  const planConf = PLAN_CONFIG[sub.plan] || PLAN_CONFIG.starter;
                  const statusConf = STATUS_CONFIG[sub.status] || STATUS_CONFIG.expired;
                  return (
                    <TableRow key={sub.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableCell>
                        <span className="font-medium text-slate-800 dark:text-white">{sub.agency.name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={planConf.className}>{planConf.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConf.className}>{statusConf.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-300">{formatDate(sub.startDate)}</TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-300">{formatDate(sub.endDate)}</TableCell>
                      <TableCell className="text-sm font-medium text-slate-800 dark:text-white">
                        {sub.amount.toLocaleString('fr-FR')} {sub.currency}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {sub.status !== 'cancelled' && sub.status !== 'expired' && (
                            <button
                              onClick={() => handleRenew(sub.id)}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-500 hover:text-emerald-600 transition-colors text-xs"
                              title="Renouveler"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          {sub.plan !== 'enterprise' && (
                            <button
                              onClick={() => handleUpgrade(sub.id, sub.plan === 'starter' ? 'pro' : 'enterprise')}
                              className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-500 hover:text-amber-600 transition-colors text-xs"
                              title="Upgrader"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                          )}
                          {sub.status === 'active' && (
                            <button
                              onClick={() => handleCancel(sub.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-600 transition-colors text-xs"
                              title="Annuler"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <span className="text-sm text-slate-500">{filteredSubs.length} abonnement(s)</span>
          </div>
        </Card>
      )}
    </div>
  );
}
