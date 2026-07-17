'use client';

import { useState, useEffect } from 'react';
import {
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Star,
  Zap,
  Shield
} from "lucide-react";
import { useAgency } from '../layout';

interface WalletData {
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  currency: string;
}

interface Transaction {
  id: string;
  transactionType: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
}

interface SubscriptionData {
  plan: string;
  status: string;
  endDate: string | null;
  maxTags: number;
  maxScans: number;
  currentTags: number;
  currentScans: number;
}

const MOBILE_MONEY_OPTIONS = [
  { name: 'Wave', color: '#1A8FD4', bgColor: 'bg-blue-100 dark:bg-blue-900/20', textColor: 'text-blue-600 dark:text-blue-400' },
  { name: 'Orange Money', color: '#FF6600', bgColor: 'bg-orange-100 dark:bg-orange-900/20', textColor: 'text-orange-600 dark:text-orange-400' },
  { name: 'MTN Money', color: '#FFCC00', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20', textColor: 'text-yellow-700 dark:text-yellow-400' },
  { name: 'CinetPay', color: '#7C3AED', bgColor: 'bg-purple-100 dark:bg-purple-900/20', textColor: 'text-purple-600 dark:text-purple-400' },
];

const PLAN_BADGES: Record<string, { label: string; classes: string }> = {
  starter: { label: 'Starter', classes: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  pro: { label: 'Pro', classes: 'bg-[#F59E0B]/10 text-[#F59E0B] dark:bg-[#F59E0B]/20 dark:text-[#F59E0B]' },
  enterprise: { label: 'Enterprise', classes: 'bg-[#10B981]/10 text-[#10B981] dark:bg-[#10B981]/20 dark:text-[#10B981]' },
};

export default function PortefeuillePage() {
  const { agencyId } = useAgency();
  const [wallet, setWallet] = useState<WalletData>({ balance: 0, totalEarned: 0, totalWithdrawn: 0, currency: 'XOF' });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionData>({
    plan: 'starter', status: 'trial', endDate: null, maxTags: 50, maxScans: 1000, currentTags: 0, currentScans: 0
  });
  const [loading, setLoading] = useState(true);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeMethod, setRechargeMethod] = useState('');
  const [rechargeLoading, setRechargeLoading] = useState(false);
  const [rechargeSuccess, setRechargeSuccess] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, [agencyId]);

  const fetchWalletData = async () => {
    try {
      const res = await fetch(`/api/agency/wallet?agencyId=${agencyId}`);
      const data = await res.json();
      if (data.wallet) {
        setWallet({
          balance: data.wallet.balance || 0,
          totalEarned: data.wallet.totalEarned || 0,
          totalWithdrawn: data.wallet.totalWithdrawn || 0,
          currency: data.wallet.currency || 'XOF',
        });
      }
      setTransactions(data.transactions || []);
      if (data.subscription) {
        setSubscription({
          plan: data.subscription.plan || 'starter',
          status: data.subscription.status || 'trial',
          endDate: data.subscription.endDate || null,
          maxTags: data.subscription.maxTags || 50,
          maxScans: data.subscription.maxScans || 1000,
          currentTags: data.subscription.currentTags || 0,
          currentScans: data.subscription.currentScans || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecharge = async () => {
    if (!rechargeAmount || !rechargeMethod) return;
    setRechargeLoading(true);
    try {
      const res = await fetch('/api/agency/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId,
          amount: parseFloat(rechargeAmount),
          method: rechargeMethod,
        })
      });
      if (res.ok) {
        setRechargeSuccess(true);
        setTimeout(() => setRechargeSuccess(false), 3000);
        setRechargeAmount('');
        setRechargeMethod('');
        fetchWalletData();
      }
    } catch (error) {
      console.error('Error recharging:', error);
    } finally {
      setRechargeLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const planBadge = PLAN_BADGES[subscription.plan] || PLAN_BADGES.starter;
  const tagsUsagePercent = subscription.maxTags > 0 ? Math.round((subscription.currentTags / subscription.maxTags) * 100) : 0;
  const scansUsagePercent = subscription.maxScans > 0 ? Math.round((subscription.currentScans / subscription.maxScans) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Portefeuille & Abonnement</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez votre solde, vos recharges et votre abonnement</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-[#10B981] to-[#059669] rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-6 h-6" />
                <span className="text-white/80 font-medium">Solde disponible</span>
              </div>
              <p className="text-4xl font-bold mb-6">{formatCurrency(wallet.balance)}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-white/70 text-sm">Total gagné</p>
                  <p className="text-xl font-bold">{formatCurrency(wallet.totalEarned)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-white/70 text-sm">Total retiré</p>
                  <p className="text-xl font-bold">{formatCurrency(wallet.totalWithdrawn)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 hidden sm:block">
                  <p className="text-white/70 text-sm">Devise</p>
                  <p className="text-xl font-bold">FCFA</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recharge Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#10B981]" />
                Recharger le portefeuille
              </h2>

              {rechargeSuccess && (
                <div className="mb-4 p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#10B981]" />
                  <span className="text-[#10B981] text-sm font-medium">Recharge effectuée avec succès !</span>
                </div>
              )}

              {/* Amount Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Montant (FCFA)</label>
                <input
                  type="number"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  placeholder="5000"
                  min="500"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
                />
              </div>

              {/* Mobile Money Options */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mode de paiement</label>
                <div className="grid grid-cols-2 gap-3">
                  {MOBILE_MONEY_OPTIONS.map((option) => (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => setRechargeMethod(option.name.toLowerCase().replace(' ', '_'))}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        rechargeMethod === option.name.toLowerCase().replace(' ', '_')
                          ? 'border-[#10B981] bg-[#10B981]/5'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg ${option.bgColor} flex items-center justify-center mx-auto mb-2`}>
                        <CreditCard className={`w-5 h-5 ${option.textColor}`} />
                      </div>
                      <p className="text-sm font-medium text-slate-800 dark:text-white">{option.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleRecharge}
                disabled={rechargeLoading || !rechargeAmount || !rechargeMethod}
                className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rechargeLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="w-4 h-4" />
                    Recharger
                  </>
                )}
              </button>
            </div>

            {/* Subscription Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-[#F59E0B]" />
                Abonnement
              </h2>

              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${planBadge.classes}`}>
                  {planBadge.label}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  subscription.status === 'active' ? 'bg-green-100 text-green-700' :
                  subscription.status === 'trial' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {subscription.status === 'active' ? 'Actif' :
                   subscription.status === 'trial' ? 'Essai' : subscription.status}
                </span>
              </div>

              {subscription.endDate && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Prochaine facturation : {new Date(subscription.endDate).toLocaleDateString('fr-FR')}
                </p>
              )}

              {/* Usage */}
              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Tags utilisés</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-white">
                      {subscription.currentTags}/{subscription.maxTags}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#10B981] rounded-full transition-all duration-500"
                      style={{ width: `${tagsUsagePercent}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Scans ce mois</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-white">
                      {subscription.currentScans}/{subscription.maxScans}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F59E0B] rounded-full transition-all duration-500"
                      style={{ width: `${scansUsagePercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Plan Features */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Zap className="w-4 h-4 text-[#10B981]" />
                  {subscription.maxTags} tags maximum
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Shield className="w-4 h-4 text-[#10B981]" />
                  {subscription.maxScans} scans/mois
                </div>
              </div>

              <button className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Passer à Pro
              </button>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#10B981]" />
                Historique des transactions
              </h2>
            </div>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Aucune transaction</p>
                <p className="text-sm text-slate-400 mt-1">Les transactions apparaîtront ici après une recharge</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                      <th className="text-left px-6 py-3 text-slate-500 dark:text-slate-400 font-medium text-xs">Type</th>
                      <th className="text-left px-6 py-3 text-slate-500 dark:text-slate-400 font-medium text-xs">Description</th>
                      <th className="text-left px-6 py-3 text-slate-500 dark:text-slate-400 font-medium text-xs">Montant</th>
                      <th className="text-left px-6 py-3 text-slate-500 dark:text-slate-400 font-medium text-xs">Statut</th>
                      <th className="text-left px-6 py-3 text-slate-500 dark:text-slate-400 font-medium text-xs">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {tx.transactionType === 'credit' ? (
                              <ArrowDownLeft className="w-4 h-4 text-[#10B981]" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4 text-rose-500" />
                            )}
                            <span className="text-sm font-medium text-slate-800 dark:text-white capitalize">
                              {tx.transactionType === 'credit' ? 'Crédit' : tx.transactionType === 'debit' ? 'Débit' : tx.transactionType}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{tx.description}</td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-bold ${tx.transactionType === 'credit' ? 'text-[#10B981]' : 'text-rose-500'}`}>
                            {tx.transactionType === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            tx.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                            tx.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                            'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
                          }`}>
                            {tx.status === 'completed' ? 'Complété' : tx.status === 'pending' ? 'En attente' : 'Échoué'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(tx.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
