'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Eye,
  MapPin,
  X,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  QrCode,
  Users,
} from "lucide-react";
import { getTagStatusInfo } from '@/lib/qr';
import { AGENCY_TYPES } from '@/lib/agency-types';

// Types
interface FoundItem {
  id: string;
  tagId: string;
  tag: {
    serialNumber: string;
    status: string;
    ownerName: string | null;
    itemName: string | null;
    agency?: { id: string; name: string; agencyType?: { name: string; label: string } | null } | null;
  };
  finderName: string | null;
  finderPhone: string | null;
  location: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  createdAt: string;
}

export default function ObjetsTrouvesPage() {
  const [items, setItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [agencyTypeFilter, setAgencyTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<FoundItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [agencyTypeFilter, dateFilter]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', 'found');
      if (agencyTypeFilter !== 'all') params.set('agencyType', agencyTypeFilter);
      if (dateFilter !== 'all') params.set('dateFilter', dateFilter);
      if (search) params.set('search', search);

      // Try the scan logs endpoint first, fall back to tags
      const res = await fetch(`/api/admin/logs?${params}&limit=200`);
      if (res.ok) {
        const data = await res.json();
        // Transform scan logs to found items format
        const foundItems = (data.logs || []).map((log: Record<string, unknown>) => ({
          id: log.id as string,
          tagId: (log.tagId as string) || '',
          tag: {
            serialNumber: (log.tag as Record<string, unknown>)?.serialNumber || (log.baggage as Record<string, unknown>)?.reference || '—',
            status: (log.tag as Record<string, unknown>)?.status || (log.baggage as Record<string, unknown>)?.status || '',
            ownerName: (log.tag as Record<string, unknown>)?.ownerName || (log.baggage as Record<string, unknown>)?.travelerFirstName || null,
            itemName: (log.tag as Record<string, unknown>)?.itemName || null,
            agency: (log.tag as Record<string, unknown>)?.agency || null,
          },
          finderName: (log.finderName as string) || null,
          finderPhone: (log.finderPhone as string) || null,
          location: (log.location as string) || null,
          city: (log.city as string) || null,
          country: (log.country as string) || null,
          latitude: (log.latitude as number) || null,
          longitude: (log.longitude as number) || null,
          notes: (log.notes as string) || (log.message as string) || null,
          createdAt: log.createdAt as string,
        }));
        setItems(foundItems);
      }
    } catch (error) {
      console.error('Error fetching found items:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Tag', 'Objet', 'Trouvé par', 'Lieu', 'Agence', 'Statut'];
    const rows = items.map(item => [
      formatDateTime(item.createdAt),
      item.tag.serialNumber,
      item.tag.itemName || 'Non renseigné',
      item.finderName || 'Anonyme',
      item.location || item.city || 'Non renseigné',
      item.tag.agency?.name || '—',
      getTagStatusInfo(item.tag.status).label,
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `objets-trouves-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMapsUrl = (lat: number | null, lng: number | null) => {
    if (!lat || !lng) return null;
    return `https://maps.app.goo.gl/?link=https://www.google.com/maps?q=${lat},${lng}`;
  };

  // Stats
  const stats = {
    total: items.length,
    withFinder: items.filter(i => i.finderName).length,
    withLocation: items.filter(i => i.location || i.city).length,
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Objets Trouvés</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Historique des objets retrouvés via QRTags</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchItems}
            variant="outline"
            className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            onClick={exportCSV}
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Total objets trouvés</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total || '—'}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <QrCode className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Avec trouveur identifié</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.withFinder || '—'}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Avec localisation</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.withLocation || '—'}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
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
                placeholder="Rechercher par tag, objet, trouveur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <Select value={agencyTypeFilter} onValueChange={setAgencyTypeFilter}>
              <SelectTrigger className="w-full lg:w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                <SelectValue placeholder="Par type d'agence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.entries(AGENCY_TYPES).map(([key, def]) => (
                  <SelectItem key={key} value={key}>{def.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full lg:w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                <SelectValue placeholder="Par date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les dates</SelectItem>
                <SelectItem value="today">Aujourd&apos;hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Items Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 mt-3">Chargement...</p>
        </div>
      ) : items.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">Aucun objet trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => {
            const statusInfo = getTagStatusInfo(item.tag.status);
            const mapsUrl = getMapsUrl(item.latitude, item.longitude);

            return (
              <div key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-800 dark:text-white font-mono font-semibold text-sm">{item.tag.serialNumber}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <p className="text-slate-500 dark:text-slate-400 text-xs mb-3">{formatDateTime(item.createdAt)}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 dark:text-slate-500 w-16 shrink-0 text-xs">Objet</span>
                    <span className="truncate">{item.tag.itemName || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 dark:text-slate-500 w-16 shrink-0 text-xs">Trouvé par</span>
                    <span className="truncate">{item.finderName || 'Anonyme'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{item.location || item.city || '—'}</span>
                  </div>
                  {item.tag.agency?.name && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400 dark:text-slate-500 w-16 shrink-0 text-xs">Agence</span>
                      <span className="truncate">{item.tag.agency.name}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => { setSelectedItem(item); setShowDetailModal(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
                    title="Voir détails"
                  >
                    <Eye className="w-4 h-4 group-hover:text-emerald-600 transition-colors" />
                    Détails
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Détails de l&apos;objet trouvé</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-mono">{selectedItem.tag.serialNumber}</p>
              </div>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedItem(null); }}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="text-slate-400 text-xl">&times;</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Tag Info */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-800 dark:text-white font-mono font-bold">{selectedItem.tag.serialNumber}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTagStatusInfo(selectedItem.tag.status).bgColor} ${getTagStatusInfo(selectedItem.tag.status).color}`}>
                    {getTagStatusInfo(selectedItem.tag.status).label}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">{selectedItem.tag.ownerName || 'Non renseigné'}</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Objet: {selectedItem.tag.itemName || 'Non renseigné'}</p>
              </div>

              {/* Finder Info */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                <h3 className="text-slate-800 dark:text-white font-medium mb-2">Trouveur</h3>
                <p className="text-slate-600 dark:text-slate-300">{selectedItem.finderName || 'Anonyme'}</p>
                {selectedItem.finderPhone && (
                  <p className="text-slate-400 dark:text-slate-500 text-sm">{selectedItem.finderPhone}</p>
                )}
              </div>

              {/* Location */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                <h3 className="text-slate-800 dark:text-white font-medium mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Localisation
                </h3>
                <p className="text-slate-600 dark:text-slate-300">{selectedItem.location || selectedItem.city || 'Non précisé'}</p>
                {selectedItem.country && <p className="text-slate-400 dark:text-slate-500 text-sm">{selectedItem.country}</p>}
                {selectedItem.latitude && selectedItem.longitude && (
                  <a
                    href={getMapsUrl(selectedItem.latitude, selectedItem.longitude) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-600 text-sm hover:underline mt-2"
                  >
                    Voir sur Google Maps
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Notes */}
              {selectedItem.notes && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                  <h3 className="text-slate-800 dark:text-white font-medium mb-2">Message</h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">{selectedItem.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
