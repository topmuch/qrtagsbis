'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  QrCode,
  MapPin,
  Clock,
  Eye,
  X,
  Search,
  Bell,
  XCircle
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
  founderName: string | null;
  founderPhone: string | null;
  founderAt: string | null;
}

export default function TrouvaillesPage() {
  const { agencyId } = useAgency();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<TagItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [previousCount, setPreviousCount] = useState(0);

  useEffect(() => {
    const savedCount = localStorage.getItem(`trouvailles-count-${agencyId}`);
    if (savedCount) setPreviousCount(parseInt(savedCount, 10));
    fetchTags();
  }, [agencyId]);

  const fetchTags = async () => {
    try {
      const params = new URLSearchParams({ agencyId, status: 'found' });
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
        founderName: (t.founderName || null) as string | null,
        founderPhone: (t.founderPhone || null) as string | null,
        founderAt: (t.founderAt || null) as string | null,
      }));
      const foundTags = tagList.filter((t: TagItem) => t.status === 'found');
      setTags(foundTags);

      const savedCount = localStorage.getItem(`trouvailles-count-${agencyId}`);
      const prevCount = savedCount ? parseInt(savedCount, 10) : 0;
      if (foundTags.length > prevCount && prevCount > 0) {
        setShowNotification(true);
      }
      localStorage.setItem(`trouvailles-count-${agencyId}`, foundTags.length.toString());
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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Objets Trouvés</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Liste des objets qui ont été marqués comme retrouvés</p>
      </div>

      {/* Success Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div className="bg-[#10B981] text-white rounded-xl p-4 shadow-lg flex items-center gap-3 max-w-sm">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Nouvel objet retrouvé !</p>
              <p className="text-white/80 text-xs">Un objet a été marqué comme retrouvé.</p>
            </div>
            <button
              onClick={() => setShowNotification(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Card */}
      <div className="bg-gradient-to-br from-[#10B981] to-[#059669] p-6 mb-8 max-w-xs rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{tags.length}</p>
            <p className="text-sm text-white/80">Objets retrouvés</p>
          </div>
        </div>
      </div>

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
                <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm hidden md:table-cell">Retrouvé le</th>
                <th className="text-left px-6 py-4 text-slate-500 dark:text-slate-400 font-medium text-sm hidden lg:table-cell">Localisation</th>
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
                        <CheckCircle className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">Aucun objet retrouvé</p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Les objets retrouvés apparaîtront ici</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTags.map((tag) => (
                  <tr
                    key={tag.id}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors bg-emerald-50/20 dark:bg-emerald-900/5"
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
                      <span className="text-slate-800 dark:text-white text-sm">
                        {tag.itemName || <span className="text-slate-400 italic">Non renseigné</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {tag.ownerName ? (
                        <span className="text-slate-800 dark:text-white font-medium text-sm">{tag.ownerName}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-sm italic">Non assigné</span>
                      )}
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
                      <button
                        onClick={() => { setSelectedTag(tag); setShowDetailModal(true); }}
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
                  <CheckCircle className="w-6 h-6 text-[#10B981]" />
                </div>
                <div>
                  <p className="text-slate-800 dark:text-white font-mono font-bold">{selectedTag.serialNumber}</p>
                  <p className="text-[#10B981] text-sm font-medium">Objet retrouvé</p>
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
                <p className="text-slate-500 dark:text-slate-400 text-sm">Retrouvé le</p>
                <p className="text-slate-800 dark:text-white text-sm">{formatDate(selectedTag.lastScanDate)}</p>
                {selectedTag.lastLocation && (
                  <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {selectedTag.lastLocation}
                  </p>
                )}
              </div>

              {/* Founder Information */}
              {selectedTag.founderName && (
                <div className="bg-[#10B981]/5 border border-[#10B981]/20 rounded-xl p-4">
                  <p className="text-[#10B981] font-medium text-sm mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Trouvé par
                  </p>
                  <div className="space-y-1">
                    <p className="text-slate-800 dark:text-white font-medium text-sm">{selectedTag.founderName}</p>
                    {selectedTag.founderPhone && (
                      <a
                        href={`https://wa.me/${selectedTag.founderPhone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors mt-2"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Contacter sur WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
