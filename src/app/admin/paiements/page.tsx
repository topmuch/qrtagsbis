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
  Wallet,
  RefreshCw,
  Search,
  DollarSign,
  Smartphone,
  CreditCard,
  ArrowDownUp,
} from "lucide-react";

// Types
interface Payment {
  id: string;
  agencyId: string;
  agency: { id: string; name: string };
  amount: number;
  currency: string;
  method: string;
  status: string;
  transactionId: string | null;
  description: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface PaymentStats {
  revenueThisMonth: number;
  pendingPayments: number;
  mobileMoneyTotal: number;
  cardTotal: number;
}

const METHOD_CONFIG: Record<string, { label: string; className: string }> = {
  wave: { label: 'Wave', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  orange_money: { label: 'Orange Money', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  mtn_money: { label: 'MTN Money', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  cinetpay: { label: 'CinetPay', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  card: { label: 'Carte', className: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
  bank_transfer: { label: 'Virement', className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  completed: { label: 'Complété', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  failed: { label: 'Échoué', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  refunded: { label: 'Remboursé', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
};

export default function PaiementsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    revenueThisMonth: 0,
    pendingPayments: 0,
    mobileMoneyTotal: 0,
    cardTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchPayments();
  }, [methodFilter, statusFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (methodFilter !== 'all') params.set('method', methodFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/payments?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredPayments = payments.filter(p =>
    !search || p.agency.name.toLowerCase().includes(search.toLowerCase()) || p.transactionId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Paiements & Revenus</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Suivez les paiements et revenus de la plateforme</p>
        </div>
        <Button
          onClick={fetchPayments}
          variant="outline"
          className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Revenus ce mois</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.revenueThisMonth.toLocaleString('fr-FR')} <span className="text-sm">FCFA</span></p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">En attente</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pendingPayments.toLocaleString('fr-FR')} <span className="text-sm">FCFA</span></p>
              </div>
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <ArrowDownUp className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Mobile Money</p>
                <p className="text-2xl font-bold text-blue-600">{stats.mobileMoneyTotal.toLocaleString('fr-FR')} <span className="text-sm">FCFA</span></p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Carte bancaire</p>
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{stats.cardTotal.toLocaleString('fr-FR')} <span className="text-sm">FCFA</span></p>
              </div>
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-slate-500" />
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
                placeholder="Rechercher par agence, référence..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full lg:w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                <SelectValue placeholder="Par méthode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les méthodes</SelectItem>
                <SelectItem value="wave">Wave</SelectItem>
                <SelectItem value="orange_money">Orange Money</SelectItem>
                <SelectItem value="mtn_money">MTN Money</SelectItem>
                <SelectItem value="cinetpay">CinetPay</SelectItem>
                <SelectItem value="card">Carte</SelectItem>
                <SelectItem value="bank_transfer">Virement</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                <SelectValue placeholder="Par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="completed">Complété</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
                <SelectItem value="refunded">Remboursé</SelectItem>
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
      ) : filteredPayments.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardContent className="py-12 text-center">
            <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Aucun paiement trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-700">
                  <TableHead>Agence</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Réf.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const methodConf = METHOD_CONFIG[payment.method] || METHOD_CONFIG.card;
                  const statusConf = PAYMENT_STATUS_CONFIG[payment.status] || PAYMENT_STATUS_CONFIG.pending;
                  return (
                    <TableRow key={payment.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableCell>
                        <span className="font-medium text-slate-800 dark:text-white">{payment.agency.name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {payment.amount.toLocaleString('fr-FR')} {payment.currency}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={methodConf.className}>{methodConf.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConf.className}>{statusConf.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-300">
                        {formatDate(payment.paidAt || payment.createdAt)}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-slate-500">{payment.transactionId || '—'}</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <span className="text-sm text-slate-500">{filteredPayments.length} paiement(s)</span>
          </div>
        </Card>
      )}
    </div>
  );
}
