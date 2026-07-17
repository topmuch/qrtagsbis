'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Luggage,
  Users,
  Clock,
  AlertTriangle,
  Eye,
  Trash2,
  MapPin,
  Building2,
  RefreshCw,
  Download,
  Search
} from "lucide-react";

// Types
interface Baggage {
  id: string;
  reference: string;
  baggageIndex: number;
  baggageType: string;
  status: string;
  lastScanDate: string | null;
  lastLocation: string | null;
  createdAt: string;
  // Founder information
  founderName: string | null;
  founderPhone: string | null;
  founderAt: string | null;
}

interface Pilgrim {
  id: string;
  firstName: string;
  lastName: string;
  whatsapp: string | null;
  agencyId: string | null;
  agency: { name: string } | null;
  createdAt: string;
  baggages: Baggage[];
}

interface PilgrimStats {
  total: number;
  activeBaggages: number;
  pending: number;
  lost: number;
}

export default function HajjAdminPage() {
  const [pilgrims, setPilgrims] = useState<Pilgrim[]>([]);
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([]);
  const [stats, setStats] = useState<PilgrimStats>({ total: 0, activeBaggages: 0, pending: 0, lost: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [agencyFilter, setAgencyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Modal
  const [selectedPilgrim, setSelectedPilgrim] = useState<Pilgrim | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Hajj pilgrims
      const response = await fetch('/api/admin/hajj');
      const data = await response.json();
      setPilgrims(data.pilgrims || []);
      setAgencies(data.agencies || []);
      calculateStats(data.pilgrims || []);
    } catch (error) {
      console.error('Error fetching Hajj data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (pilgrimList: Pilgrim[]) => {
    let activeBaggages = 0;
    let pending = 0;
    let lost = 0;

    pilgrimList.forEach(pilgrim => {
      pilgrim.baggages.forEach(bag => {
        if (bag.status === 'active') activeBaggages++;
        if (bag.status === 'pending_activation') pending++;
        if (bag.status === 'lost') lost++;
      });
    });

    setStats({
      total: pilgrimList.length,
      activeBaggages,
      pending,
      lost
    });
  };

  // Get global status for a pilgrim (worst bagage status)
  const getGlobalStatus = (baggages: Baggage[]): { status: string; label: string; color: string } => {
    const statuses = baggages.map(b => b.status);

    if (statuses.some(s => s === 'lost')) {
      const lostCount = statuses.filter(s => s === 'lost').length;
      return { status: 'lost', label: `⚠️ ${lostCount}/3 perdu${lostCount > 1 ? 's' : ''}`, color: 'bg-red-100 text-red-700' };
    }
    if (statuses.some(s => s === 'scanned')) {
      return { status: 'scanned', label: '🔍 Scanné', color: 'bg-blue-100 text-blue-700' };
    }
    if (statuses.some(s => s === 'pending_activation')) {
      return { status: 'pending', label: '⚪ En attente', color: 'bg-amber-100 text-amber-700' };
    }
    if (statuses.every(s => s === 'active')) {
      return { status: 'active', label: '✅ Actif', color: 'bg-emerald-100 text-emerald-700' };
    }

    return { status: 'mixed', label: 'Mixte', color: 'bg-slate-100 text-slate-600' };
  };

  // Get last scan date from baggages
  const getLastScan = (baggages: Baggage[]): string => {
    const scanDates = baggages
      .filter(b => b.lastScanDate)
      .map(b => new Date(b.lastScanDate!))
      .sort((a, b) => b.getTime() - a.getTime());

    if (scanDates.length === 0) return 'Jamais';

    const lastDate = scanDates[0];
    return `${lastDate.getDate().toString().padStart(2, '0')}/${(lastDate.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  // Filter pilgrims
  const filteredPilgrims = pilgrims.filter(pilgrim => {
    // Search filter
    if (searchFilter) {
      const fullName = `${pilgrim.firstName} ${pilgrim.lastName}`.toLowerCase();
      if (!fullName.includes(searchFilter.toLowerCase())) return false;
    }

    // Agency filter
    if (agencyFilter !== 'all' && pilgrim.agencyId !== agencyFilter) return false;

    // Status filter
    if (statusFilter !== 'all') {
      const globalStatus = getGlobalStatus(pilgrim.baggages);
      if (statusFilter === 'active' && globalStatus.status !== 'active') return false;
      if (statusFilter === 'pending' && globalStatus.status !== 'pending') return false;
      if (statusFilter === 'lost' && globalStatus.status !== 'lost') return false;
    }

    // Date filter
    if (dateFilter) {
      const createdDate = new Date(pilgrim.createdAt).toISOString().split('T')[0];
      if (createdDate !== dateFilter) return false;
    }

    return true;
  });

  const handleDeletePilgrim = async (pilgrimId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce pèlerin et ses bagages ?')) return;

    try {
      const response = await fetch(`/api/admin/hajj?id=${pilgrimId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting pilgrim:', error);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Nom', 'Prénom', 'Agence', 'Statut', 'Bagages', 'Dernier scan'];
    const rows = filteredPilgrims.map(p => [
      p.lastName,
      p.firstName,
      p.agency?.name || '-',
      getGlobalStatus(p.baggages).label,
      `${p.baggages.length} bagages`,
      getLastScan(p.baggages)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hajj_pilgrims_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Pèlerins Hajj 2026</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez les pèlerins et leurs 3 bagages</p>
      </div>
      {/* Action Buttons */}
      <div className="flex gap-2 mb-6">
        <Button
          variant="outline"
          className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
          onClick={handleExportCSV}
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
          onClick={fetchData}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Total pèlerins</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-700 dark:text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Bagages actifs</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.activeBaggages}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <Luggage className="w-6 h-6 text-blue-700 dark:text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">En attente</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600 dark:text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Perdus</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.lost}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Rechercher un pèlerin..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white pl-9"
              />
            </div>
            <Select value={agencyFilter} onValueChange={setAgencyFilter}>
              <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white">
                <SelectValue placeholder="Agence" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                <SelectItem value="all">Toutes les agences</SelectItem>
                {agencies.map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">✅ Actif</SelectItem>
                <SelectItem value="pending">⚪ En attente</SelectItem>
                <SelectItem value="lost">⚠️ Perdu</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pilgrim Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
        </div>
      ) : filteredPilgrims.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 border border-slate-200 dark:border-slate-700 text-center">
          <p className="text-slate-500 dark:text-slate-400">Aucun pèlerin trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPilgrims.map((pilgrim) => {
            const globalStatus = getGlobalStatus(pilgrim.baggages);
            return (
              <div
                key={pilgrim.id}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  setSelectedPilgrim(pilgrim);
                  setModalOpen(true);
                }}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🕋</span>
                    <span className="font-medium text-slate-800 dark:text-white">{pilgrim.firstName} {pilgrim.lastName}</span>
                  </div>
                  <Badge className={globalStatus.color}>
                    {globalStatus.label}
                  </Badge>
                </div>

                {/* Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{pilgrim.agency?.name || 'Non renseignée'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Luggage className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>🧳 ×{pilgrim.baggages.length} bagages</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="text-xs">Dernier scan: {getLastScan(pilgrim.baggages)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
                    onClick={() => {
                      setSelectedPilgrim(pilgrim);
                      setModalOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                    onClick={() => handleDeletePilgrim(pilgrim.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pilgrim Details Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">🕋</span>
              {selectedPilgrim?.firstName} {selectedPilgrim?.lastName}
            </DialogTitle>
          </DialogHeader>

          {selectedPilgrim && (
            <div className="space-y-6 pt-4">
              {/* Pilgrim Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-slate-500 text-sm mb-1">Agence</p>
                  <p className="text-slate-800 font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {selectedPilgrim.agency?.name || 'Non renseignée'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-slate-500 text-sm mb-1">WhatsApp</p>
                  <p className="text-slate-800 font-medium">
                    {selectedPilgrim.whatsapp || 'Non renseigné'}
                  </p>
                </div>
              </div>

              {/* Baggages */}
              <div>
                <h3 className="text-slate-800 font-medium mb-3 flex items-center gap-2">
                  <Luggage className="w-5 h-5" />
                  Bagages (3)
                </h3>
                <div className="space-y-2">
                  {selectedPilgrim.baggages.map((baggage, index) => (
                    <div
                      key={baggage.id}
                      className="bg-slate-50 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            baggage.baggageType === 'cabine'
                              ? 'bg-blue-100'
                              : 'bg-emerald-100'
                          }`}>
                            <Luggage className={`w-5 h-5 ${
                              baggage.baggageType === 'cabine'
                                ? 'text-blue-600'
                                : 'text-blue-700'
                            }`} />
                          </div>
                          <div>
                            <p className="text-slate-800 font-medium">
                              {baggage.baggageType === 'cabine' ? 'Cabine' : `Soute ${index}`}
                            </p>
                            <p className="text-slate-500 text-sm font-mono">
                              {baggage.reference}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {baggage.lastLocation && (
                            <span className="text-slate-500 text-sm flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {baggage.lastLocation}
                            </span>
                          )}
                          <Badge className={
                            baggage.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : baggage.status === 'pending_activation'
                                ? 'bg-amber-100 text-amber-700'
                                : baggage.status === 'lost'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-700'
                          }>
                            {baggage.status === 'active' && '✅ Actif'}
                            {baggage.status === 'pending_activation' && '⚪ En attente'}
                            {baggage.status === 'lost' && '⚠️ Perdu'}
                            {baggage.status === 'scanned' && '🔍 Scanné'}
                          </Badge>
                        </div>
                      </div>
                      {/* Founder Information */}
                      {baggage.founderName && (
                        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-blue-700 text-sm font-medium">👤 Trouvé par:</span>
                            <span className="text-slate-800 font-medium">{baggage.founderName}</span>
                          </div>
                          {baggage.founderPhone && (
                            <a 
                              href={`https://wa.me/${baggage.founderPhone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-700 hover:text-emerald-700 text-sm"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              {baggage.founderPhone}
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
