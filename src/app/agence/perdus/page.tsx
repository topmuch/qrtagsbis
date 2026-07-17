'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  QrCode,
  MapPin,
  Clock,
  Eye,
  X,
  Search,
  CheckCircle,
  Phone
} from "lucide-react";
import { useAgency } from '../layout';
import { normalizeStatus } from '@/lib/status';

interface TagItem {
  id: string;
  serialNumber: string;
  type: string;
  ownerName: string | null;
  ownerPhone: string | null;
  itemName: string | null;
  status: string;
  createdAt: string;
  lastScanDate: string | null;
  lastLocation: string | null;
}

export default function PerdusPage() {
  const { agencyId } = useAgency();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<TagItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchTags();
  }, [agencyId]);

  const fetchTags = async () => {
    try {
      const params = new URLSearchParams({ agencyId, status: 'lost' });
      const response = await fetch(`/api/agency/tags?${params}`);
      const data = await response.json();
      const tagList: TagItem[] = (data.tags || []).map((t: Record<string, unknown>) => ({
        id: t.id as string,
        serialNumber: (t.serialNumber || t.reference || '') as string,
        type: (t.type || '') as string,
        ownerName: (t.ownerName || t.travelerFirstName || null) as string | null,
        ownerPhone: (t.ownerPhone || t.whatsappOwner || null) as string | null,
        itemName: (t.itemName || null) as string | null,
        status: normalizeStatus((t.status || 'created') as string),
        createdAt: (t.createdAt || '') as string,
        lastScanDate: (t.lastScanDate || null) as string | null,
        lastLocation: (t.lastLocation || null) as string | null,
      }));
      setTags(tagList.filter((t: TagItem) => t.status === 'lost'));
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTags = tags.filter(t =>
    t.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
    (t.ownerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.itemName || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }) + ' à ' + date.toLocaleTimeString('fr-FR', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleMarkFound = async (tagId: string) => {
    if (!confirm('Marquer cet objet comme retrouvé ?')) return;
    try {
      const res = await fetch(`/api/agency/tags`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId, status: 'found' })
      });
      if (res.ok) fetchTags();
    } catch (error) {
      console.error('Error marking found:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Objets Perdus</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Liste des objets déclarés perdus — Priorité haute</p>
      </div>

      {/* Stats Card */}
      <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-6 mb-8 max-w-xs rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{tags.length}</p>
            <p className="text-sm text-white/80">Objets perdus</p>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      {tags.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
          <div>
            <p className="text-rose-700 dark:text-rose-400 font-medium">Attention !</p>
            <p className="text-rose-600 dark:text-rose-300 text-sm">
              Vous avez {tags.length} objet(s) signalé(s) comme perdu(s). Contactez rapidement les propriétaires concernés.
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par N° série, propriétaire ou objet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
          />
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
                <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Propriétaire</th>
                <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm hidden md:table-cell">Dernier scan</th>
                <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm hidden lg:table-cell">Localisation</th>
                <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
                      <span className="text-slate-500">Chargement...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTags.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/10 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">Aucun objet perdu</p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Excellent ! Tous vos objets sont bien suivis.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTags.map((tag) => (
                  <tr
                    key={tag.id}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors bg-rose-50/30 dark:bg-rose-500/5"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-500/10 flex items-center justify-center">
                          <QrCode className="w-4 h-4 text-rose-500" />
                        </div>
                        <span className="text-slate-800 dark:text-white font-mono font-medium text-sm">
                          {tag.serialNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-800 dark:text-white text-sm">
                        {tag.itemName || <span className="text-slate-400 italic">Non renseigné</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        {tag.ownerName ? (
                          <span className="text-slate-800 dark:text-white font-medium text-sm">{tag.ownerName}</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-sm italic">Non assigné</span>
                        )}
                        {tag.ownerPhone && (
                          <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {tag.ownerPhone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {formatDate(tag.lastScanDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {tag.lastLocation ? (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          {tag.lastLocation}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMarkFound(tag.id)}
                          className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/30 transition-colors flex items-center gap-1"
                          title="Marquer comme retrouvé"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Retrouvé
                        </button>
                        <button
                          onClick={() => { setSelectedTag(tag); setShowDetailModal(true); }}
                          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
                        </button>
                      </div>
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
                <div className="w-12 h-12 bg-rose-100 dark:bg-rose-500/10 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <p className="text-slate-800 dark:text-white font-mono font-bold">{selectedTag.serialNumber}</p>
                  <p className="text-rose-500 text-sm font-medium">Objet perdu</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Objet</p>
                  <p className="text-slate-800 dark:text-white font-medium text-sm">{selectedTag.itemName || 'Non renseigné'}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Propriétaire</p>
                  <p className="text-slate-800 dark:text-white text-sm font-medium">{selectedTag.ownerName || 'Non assigné'}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Téléphone</p>
                <p className="text-slate-800 dark:text-white text-sm">{selectedTag.ownerPhone || 'Non renseigné'}</p>
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

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    handleMarkFound(selectedTag.id);
                    setShowDetailModal(false);
                    setSelectedTag(null);
                  }}
                  className="w-full bg-[#10B981] text-white py-3 rounded-xl font-medium hover:bg-[#059669] transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Marquer comme retrouvé
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
