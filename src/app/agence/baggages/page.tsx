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
  Plus,
  Filter,
  Trash2,
  Loader2,
  Tag
} from "lucide-react";
import { useAgency } from '../layout';
import { normalizeStatus } from '@/lib/status';
import { getTagStatusInfo } from '@/lib/qr';

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
  customData: string;
}

export default function TagsPage() {
  const { agencyId, agencyName } = useAgency();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [filteredTags, setFilteredTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTag, setSelectedTag] = useState<TagItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchTags();
  }, [agencyId]);

  useEffect(() => {
    let result = tags;
    if (statusFilter !== 'all') {
      result = result.filter(t => normalizeStatus(t.status) === statusFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(t =>
        t.serialNumber.toLowerCase().includes(s) ||
        (t.ownerName || '').toLowerCase().includes(s) ||
        (t.itemName || '').toLowerCase().includes(s)
      );
    }
    setFilteredTags(result);
  }, [tags, search, statusFilter]);

  const fetchTags = async () => {
    try {
      setLoading(true);
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
        customData: (t.customData || '{}') as string,
      }));
      setTags(tagList);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }) + ' à ' + date.toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  const renderStatusBadge = (status: string) => {
    const info = getTagStatusInfo(normalizeStatus(status));
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${info.bgColor} ${info.color}`}>
        {info.label}
      </span>
    );
  };

  const getCategoryLabel = (cat: string | null) => {
    const map: Record<string, string> = {
      bagage: 'Bagage',
      electronique: 'Électronique',
      documents: 'Documents',
      vetements: 'Vêtements',
      accessoires: 'Accessoires',
      autres: 'Autres',
    };
    return cat ? (map[cat] || cat) : '-';
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Mes Tags</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez vos tags QRTags — {agencyName}</p>
        </div>
        <Link
          href="/agence/activations"
          className="flex items-center gap-2 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Activer un tag
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par N° série, propriétaire, objet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]/20"
        >
          <option value="all">Tous les statuts</option>
          <option value="created">Créé</option>
          <option value="activated">Activé</option>
          <option value="scanned">Scanné</option>
          <option value="lost">Perdu</option>
          <option value="found">Retrouvé</option>
          <option value="blocked">Bloqué</option>
          <option value="expired">Expiré</option>
        </select>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{tags.length}</p>
          <p className="text-xs text-slate-500">Total</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{tags.filter(t => normalizeStatus(t.status) === 'activated' || normalizeStatus(t.status) === 'scanned').length}</p>
          <p className="text-xs text-slate-500">Actifs</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/10 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-rose-600">{tags.filter(t => normalizeStatus(t.status) === 'lost').length}</p>
          <p className="text-xs text-slate-500">Perdus</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{tags.filter(t => normalizeStatus(t.status) === 'found').length}</p>
          <p className="text-xs text-slate-500">Retrouvés</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">N° Série</th>
                <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Objet</th>
                <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm hidden md:table-cell">Propriétaire</th>
                <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Statut</th>
                <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm hidden lg:table-cell">Dernier scan</th>
                <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
                      <span className="text-slate-500">Chargement...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTags.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <Tag className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">Aucun tag trouvé</p>
                      <Link href="/agence/activations" className="text-sm text-[#10B981] hover:underline mt-2">
                        Activer votre premier tag
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTags.map((tag) => (
                  <tr
                    key={tag.id}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                          <QrCode className="w-4 h-4 text-[#10B981]" />
                        </div>
                        <span className="text-slate-800 dark:text-white font-mono font-medium text-sm">
                          {tag.serialNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-slate-800 dark:text-white text-sm">{tag.itemName || <span className="text-slate-400 italic">Non renseigné</span>}</p>
                        {tag.itemCategory && (
                          <p className="text-slate-400 text-xs mt-0.5">{getCategoryLabel(tag.itemCategory)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div>
                        {tag.ownerName ? (
                          <span className="text-slate-800 dark:text-white text-sm">{tag.ownerName}</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-sm italic">Non assigné</span>
                        )}
                        {tag.ownerPhone && (
                          <p className="text-slate-500 text-xs mt-0.5">{tag.ownerPhone}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {renderStatusBadge(tag.status)}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(tag.lastScanDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedTag(tag);
                          setShowDetailModal(true);
                        }}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4 text-slate-400 group-hover:text-[#10B981]" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedTag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Détails du tag</h2>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedTag(null); }}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#10B981]/10 rounded-xl flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-[#10B981]" />
                </div>
                <div>
                  <p className="text-slate-800 dark:text-white font-mono font-bold">{selectedTag.serialNumber}</p>
                  {renderStatusBadge(selectedTag.status)}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Objet</p>
                  <p className="text-slate-800 dark:text-white text-sm font-medium">{selectedTag.itemName || 'Non renseigné'}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Catégorie</p>
                  <p className="text-slate-800 dark:text-white text-sm">{getCategoryLabel(selectedTag.itemCategory)}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Propriétaire</p>
                  <p className="text-slate-800 dark:text-white text-sm font-medium">{selectedTag.ownerName || 'Non assigné'}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Téléphone</p>
                  <p className="text-slate-800 dark:text-white text-sm">{selectedTag.ownerPhone || 'Non renseigné'}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Dernier scan</p>
                <p className="text-slate-800 dark:text-white text-sm">{formatDate(selectedTag.lastScanDate)}</p>
                {selectedTag.lastLocation && (
                  <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {selectedTag.lastLocation}
                  </p>
                )}
              </div>

              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Créé le</p>
                <p className="text-slate-800 dark:text-white text-sm">{formatDate(selectedTag.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
