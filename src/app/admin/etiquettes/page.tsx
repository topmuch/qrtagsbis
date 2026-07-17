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
  QrCode,
  Search,
  Eye,
  RefreshCw,
  CheckCircle,
  Ban,
  Download,
  Filter,
  MoreHorizontal,
  Clock,
  Package,
} from "lucide-react";
import { getTagStatusInfo } from '@/lib/qr';

// Types
interface TagItem {
  id: string;
  serialNumber: string;
  tagType: string;
  status: string;
  ownerName: string | null;
  itemName: string | null;
  itemCategory: string | null;
  agencyId: string | null;
  agency?: { id: string; name: string; agencyType?: { name: string; label: string } } | null;
  lastScanDate: string | null;
  createdAt: string;
  customData: string;
}

const TYPE_LABELS: Record<string, string> = {
  hotel: 'Hôtel',
  bus: 'Bus',
  school: 'École',
  clinic: 'Clinique',
  car_rental: 'Location auto',
  luggage_storage: 'Consigne',
  enterprise: 'Entreprise',
  event: 'Événement',
  standard: 'Standard',
  premium: 'Premium',
  disposable: 'Jetable',
};

export default function TagsPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [agencyFilter, setAgencyFilter] = useState('all');
  const [agencies, setAgencies] = useState<{ id: string; name: string }[]>([]);
  const [selectedTag, setSelectedTag] = useState<TagItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchTags();
    fetchAgencies();
  }, [typeFilter, statusFilter, agencyFilter, search]);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (agencyFilter !== 'all') params.set('agencyId', agencyFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/tags?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTags(data.tags || []);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgencies = async () => {
    try {
      const res = await fetch('/api/admin/agencies');
      if (res.ok) {
        const data = await res.json();
        setAgencies(data.agencies || []);
      }
    } catch (error) {
      console.error('Error fetching agencies:', error);
    }
  };

  const handleMarkFound = async (tagId: string) => {
    try {
      const res = await fetch('/api/admin/tags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tagId, status: 'found' }),
      });
      if (res.ok) {
        fetchTags();
      }
    } catch (error) {
      console.error('Error marking tag as found:', error);
    }
  };

  const handleBlock = async (tagId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir bloquer ce tag ?')) return;
    try {
      const res = await fetch('/api/admin/tags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tagId, status: 'blocked' }),
      });
      if (res.ok) {
        fetchTags();
      }
    } catch (error) {
      console.error('Error blocking tag:', error);
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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestion des Tags</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez tous les tags QR codes de la plateforme</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchTags}
            variant="outline"
            className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Link href="/admin/generer">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">
              <QrCode className="w-4 h-4 mr-2" />
              Générer
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par n° série, propriétaire, objet..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full lg:w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                <SelectValue placeholder="Par type d'agence" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="hotel">Hôtel</SelectItem>
                <SelectItem value="bus">Bus</SelectItem>
                <SelectItem value="school">École</SelectItem>
                <SelectItem value="clinic">Clinique</SelectItem>
                <SelectItem value="car_rental">Location auto</SelectItem>
                <SelectItem value="luggage_storage">Consigne</SelectItem>
                <SelectItem value="enterprise">Entreprise</SelectItem>
                <SelectItem value="event">Événement</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                <SelectValue placeholder="Par statut" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="created">Créé</SelectItem>
                <SelectItem value="activated">Activé</SelectItem>
                <SelectItem value="scanned">Scanné</SelectItem>
                <SelectItem value="lost">Perdu</SelectItem>
                <SelectItem value="found">Retrouvé</SelectItem>
                <SelectItem value="blocked">Bloqué</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
              </SelectContent>
            </Select>

            {/* Agency Filter */}
            <Select value={agencyFilter} onValueChange={setAgencyFilter}>
              <SelectTrigger className="w-full lg:w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                <SelectValue placeholder="Par agence" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <SelectItem value="all">Toutes les agences</SelectItem>
                {agencies.map((agency) => (
                  <SelectItem key={agency.id} value={agency.id}>
                    {agency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tags Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <span className="text-slate-500 dark:text-slate-400">Chargement...</span>
          </div>
        </div>
      ) : tags.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">Aucun tag trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-700">
                  <TableHead className="text-slate-500 dark:text-slate-400">N° Série</TableHead>
                  <TableHead className="text-slate-500 dark:text-slate-400">Type</TableHead>
                  <TableHead className="text-slate-500 dark:text-slate-400">Agence</TableHead>
                  <TableHead className="text-slate-500 dark:text-slate-400">Propriétaire</TableHead>
                  <TableHead className="text-slate-500 dark:text-slate-400">Objet</TableHead>
                  <TableHead className="text-slate-500 dark:text-slate-400">Statut</TableHead>
                  <TableHead className="text-slate-500 dark:text-slate-400">Dernier scan</TableHead>
                  <TableHead className="text-slate-500 dark:text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => {
                  const statusInfo = getTagStatusInfo(tag.status);
                  return (
                    <TableRow key={tag.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableCell>
                        <span className="font-mono font-semibold text-sm text-slate-800 dark:text-white">{tag.serialNumber}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {TYPE_LABELS[tag.tagType] || tag.tagType}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {tag.agency?.name || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {tag.ownerName || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {tag.itemName || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {formatDate(tag.lastScanDate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setSelectedTag(tag); setShowDetailModal(true); }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-emerald-600 transition-colors"
                            title="Voir détail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {(tag.status === 'lost' || tag.status === 'scanned') && (
                            <button
                              onClick={() => handleMarkFound(tag.id)}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-500 hover:text-emerald-600 transition-colors"
                              title="Marquer trouvé"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {tag.status !== 'blocked' && tag.status !== 'expired' && (
                            <button
                              onClick={() => handleBlock(tag.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-600 transition-colors"
                              title="Bloquer"
                            >
                              <Ban className="w-4 h-4" />
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
            <span className="text-sm text-slate-500 dark:text-slate-400">{tags.length} tag(s) affiché(s)</span>
          </div>
        </Card>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Détails du tag</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-mono">{selectedTag.serialNumber}</p>
              </div>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedTag(null); }}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="text-slate-400 text-xl">&times;</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-800 dark:text-white font-mono font-bold">{selectedTag.serialNumber}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTagStatusInfo(selectedTag.status).bgColor} ${getTagStatusInfo(selectedTag.status).color}`}>
                    {getTagStatusInfo(selectedTag.status).label}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-sm">Type: {TYPE_LABELS[selectedTag.tagType] || selectedTag.tagType}</p>
                <p className="text-slate-600 dark:text-slate-300 text-sm">Agence: {selectedTag.agency?.name || 'Non assigné'}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <h3 className="text-slate-800 dark:text-white font-medium mb-2">Propriétaire</h3>
                <p className="text-slate-600 dark:text-slate-300">{selectedTag.ownerName || 'Non renseigné'}</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                  Téléphone: {selectedTag.ownerPhone || 'Non renseigné'}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <h3 className="text-slate-800 dark:text-white font-medium mb-2">Objet</h3>
                <p className="text-slate-600 dark:text-slate-300">{selectedTag.itemName || 'Non renseigné'}</p>
                {selectedTag.itemDescription && (
                  <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">{selectedTag.itemDescription}</p>
                )}
              </div>

              <div className="flex gap-2">
                {(selectedTag.status === 'lost' || selectedTag.status === 'scanned') && (
                  <button
                    onClick={() => { handleMarkFound(selectedTag.id); setShowDetailModal(false); }}
                    className="flex-1 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Marquer trouvé
                  </button>
                )}
                {selectedTag.status !== 'blocked' && selectedTag.status !== 'expired' && (
                  <button
                    onClick={() => { handleBlock(selectedTag.id); setShowDetailModal(false); }}
                    className="flex-1 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Ban className="w-4 h-4" />
                    Bloquer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return <a href={href} className={className}>{children}</a>;
}
