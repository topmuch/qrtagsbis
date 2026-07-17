'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import {
  Search,
  Eye,
  Download,
  Share2,
  Trash2,
  Plane,
  Luggage,
  QrCode,
  Plus,
  ArrowLeft,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileArchive,
  Archive,
  Filter,
  Loader2,
} from "lucide-react";

interface QRSet {
  id: string;
  setId: string;
  type: string;
  agencyId: string | null;
  agencyName: string | null;
  createdAt: Date;
  qrCount: number;
  references: string[];
  status: string;
  travelerName: string | null;
  baggageIds: string[];
}

interface Stats {
  totalSets: number;
  totalQr: number;
  hajjSets: number;
  voyageurSets: number;
}

interface Agency {
  id: string;
  name: string;
}

export default function QRCodesPage() {
  const qrRef = useRef<HTMLDivElement>(null);
  
  const [sets, setSets] = useState<QRSet[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalSets: 0,
    totalQr: 0,
    hajjSets: 0,
    voyageurSets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedSet, setSelectedSet] = useState<QRSet | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Selection for bulk export
  const [selectedSetIds, setSelectedSetIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Export modal state
  const [exportAgencies, setExportAgencies] = useState<Agency[]>([]);
  const [exportForm, setExportForm] = useState({
    mode: 'selected' as 'selected' | 'agency' | 'type',
    agencyId: '',
    type: 'hajj' as 'hajj' | 'voyageur',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');

  useEffect(() => {
    fetchSets();
    fetchAgencies();
  }, [typeFilter, search]);

  const fetchSets = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (search) params.set('search', search);

      const response = await fetch(`/api/qrcodes?${params}`);
      const data = await response.json();

      setSets(data.sets);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching QR sets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgencies = async () => {
    try {
      const res = await fetch('/api/admin/agencies');
      const data = await res.json();
      setExportAgencies(data.agencies || []);
    } catch (error) {
      console.error('Error fetching agencies:', error);
    }
  };

  // Selection handlers
  const toggleSetSelection = useCallback((setId: string) => {
    setSelectedSetIds(prev => {
      const next = new Set(prev);
      if (next.has(setId)) {
        next.delete(setId);
      } else {
        next.add(setId);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectAll) {
      setSelectedSetIds(new Set());
      setSelectAll(false);
    } else {
      setSelectedSetIds(new Set(sets.map(s => s.setId)));
      setSelectAll(true);
    }
  }, [selectAll, sets]);

  // Keep selectAll in sync
  useEffect(() => {
    if (sets.length > 0 && selectedSetIds.size === sets.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedSetIds, sets.length]);

  const handleDeleteSet = async () => {
    if (!selectedSet) return;

    try {
      const params = new URLSearchParams({ setId: selectedSet.setId });
      await fetch(`/api/qrcodes?${params}`, { method: 'DELETE' });

      setSets(sets.filter(s => s.setId !== selectedSet.setId));
      setShowDeleteModal(false);
      setSelectedSet(null);
    } catch (error) {
      console.error('Error deleting set:', error);
    }
  };

  const handleDownloadSet = async (set: QRSet) => {
    setIsDownloading(true);
    setSelectedSet(set);

    try {
      // Use server-side ZIP export for single set with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

      let response: Response;
      try {
        response = await fetch('/api/admin/baggages/export-zip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ setId: set.setId }),
          signal: controller.signal,
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          throw new Error('Délai d\'attente dépassé');
        }
        throw fetchError;
      }
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Export échoué' }));
        throw new Error(errorData.error || 'Export failed');
      }

      // Get the filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `QRTags-${set.setId}.zip`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i) ||
                      contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = decodeURIComponent(match[1].replace(/"/g, ''));
      }

      // Download the ZIP
      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error('Le fichier ZIP est vide');
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (error) {
      console.error('Error downloading:', error);
      alert('Erreur lors du téléchargement: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setIsDownloading(false);
      setSelectedSet(null);
    }
  };

  // Bulk ZIP export
  const handleExportZip = async () => {
    setIsExporting(true);
    setExportProgress('Préparation de l\'export...');

    try {
      let payload: Record<string, unknown>;

      if (exportForm.mode === 'selected') {
        if (selectedSetIds.size === 0) {
          alert('Veuillez sélectionner au moins un set de QR codes');
          setIsExporting(false);
          return;
        }
        payload = { setIds: Array.from(selectedSetIds) };
      } else if (exportForm.mode === 'agency') {
        if (!exportForm.agencyId) {
          alert('Veuillez sélectionner une agence');
          setIsExporting(false);
          return;
        }
        payload = { agencyId: exportForm.agencyId };
      } else {
        payload = { type: exportForm.type, agencyId: '__all__' };
      }

      setExportProgress('Génération des QR codes...');

      // Use timeout for large exports
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 min timeout

      let response: Response;
      try {
        response = await fetch('/api/admin/baggages/export-zip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          throw new Error('Délai d\'attente dépassé. L\'export est trop volumineux.');
        }
        throw fetchError;
      }
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Export échoué' }));
        throw new Error(errorData.error || 'Export failed');
      }

      setExportProgress('Téléchargement du fichier ZIP...');

      // Get filename
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'QRTags-export.zip';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i) ||
                      contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = decodeURIComponent(match[1].replace(/"/g, ''));
      }

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error('Le fichier ZIP est vide');
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      setExportProgress('Export terminé !');
      setTimeout(() => {
        setShowExportModal(false);
        setExportProgress('');
        setSelectedSetIds(new Set());
      }, 1500);
    } catch (error) {
      console.error('Error exporting ZIP:', error);
      alert('Erreur lors de l\'export ZIP: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareSet = async (set: QRSet) => {
    const shareText = `QRTags - ${set.setId}\n${set.qrCount} QR codes générés\nType: ${set.type === 'hajj' ? 'Hajj 2026' : 'Voyageur'}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `QRTags - ${set.setId}`,
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Copié dans le presse-papiers !');
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Filter buttons
  const filterButtons = [
    { id: 'all', label: 'Tous' },
    { id: 'hajj', label: 'Hajj' },
    { id: 'voyageur', label: 'Voyageur' },
  ];

  // KPI Cards
  const kpiCards = [
    { title: 'Total Sets', value: stats.totalSets, icon: QrCode, color: 'text-[#b8860b]' },
    { title: 'Total QR', value: stats.totalQr, icon: Luggage, color: 'text-white' },
    { title: 'Hajj', value: stats.hajjSets, icon: Plane, color: 'text-green-400' },
    { title: 'Voyageur', value: stats.voyageurSets, icon: Luggage, color: 'text-blue-600' },
  ];

  // Calculate total QR in selection
  const selectedQrCount = sets
    .filter(s => selectedSetIds.has(s.setId))
    .reduce((sum, s) => sum + s.qrCount, 0);

  return (
    <div className="min-h-screen bg-[#080c1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 rounded-lg bg-[#0d152a] hover:bg-[#1a2238] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#a0a8b8]" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">QR Codes Générés</h1>
              <p className="text-[#a0a8b8] text-sm">Gérez vos sets de QR codes</p>
            </div>
          </div>
          <div className="flex gap-3">
            {/* Export ZIP Button */}
            <button
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#1e7e34] to-[#0d5e34] text-white rounded-lg hover:from-[#228b22] hover:to-[#1e7e34] transition-all shadow-lg shadow-green-900/30"
            >
              <Archive className="w-4 h-4" />
              Export ZIP
            </button>
            <Link
              href="/admin/generer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#b8860b] text-white rounded-lg hover:bg-[#3b82f6] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Générer nouveau
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpiCards.map((card, index) => (
            <div
              key={index}
              className="bg-[#0d152a] border border-[#1a2238] rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-[#a0a8b8] text-sm">{card.title}</p>
            </div>
          ))}
        </div>

        {/* Selection Info Bar */}
        {selectedSetIds.size > 0 && (
          <div className="mb-4 px-5 py-3 bg-gradient-to-r from-[#0d5e34] to-[#1e7e34] rounded-xl border border-[#0d5e34] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-white" />
              <span className="text-white font-medium">
                {selectedSetIds.size} set(s) sélectionné(s) — {selectedQrCount} QR codes
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowExportModal(true);
                  setExportForm(prev => ({ ...prev, mode: 'selected' }));
                }}
                className="px-3 py-1.5 bg-white text-[#0d5e34] rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-1"
              >
                <Archive className="w-3.5 h-3.5" />
                Exporter ZIP
              </button>
              <button
                onClick={() => setSelectedSetIds(new Set())}
                className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors"
              >
                Tout désélectionner
              </button>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Rechercher par référence ou set..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0d152a] border border-[#1a2238] rounded-lg py-3 px-4 text-[#e0e6f0] placeholder-[#a0a8b8] focus:outline-none focus:border-[#b8860b]/50"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a0a8b8]" />
          </div>
          <div className="flex gap-2">
            {filterButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => setTypeFilter(btn.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  typeFilter === btn.id
                    ? 'bg-[#b8860b] text-white'
                    : 'bg-[#0d152a] text-[#a0a8b8] hover:bg-[#1a2238]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* QR Sets List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-2 border-[#b8860b]/30 border-t-[#b8860b] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#a0a8b8]">Chargement...</p>
            </div>
          ) : sets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[#0d152a] rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-[#a0a8b8]" />
              </div>
              <p className="text-[#a0a8b8]">Aucun QR code généré</p>
              <p className="text-sm text-[#a0a8b8]/60 mt-2">
                Générez vos premiers QR codes pour commencer.
              </p>
            </div>
          ) : (
            <>
              {/* Select All Row */}
              <div className="flex items-center gap-3 px-5 py-2 bg-[#0d152a] rounded-lg border border-[#1a2238]">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-[#1a2238] bg-[#080c1a] text-[#b8860b] focus:ring-[#b8860b] accent-[#b8860b]"
                />
                <span className="text-[#a0a8b8] text-sm">
                  Tout sélectionner ({sets.length} sets)
                </span>
              </div>

              {sets.map((set) => (
                <div
                  key={set.id}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-xl border gap-4 transition-colors ${
                    selectedSetIds.has(set.setId)
                      ? 'bg-[#0d5e34]/10 border-[#0d5e34]/50'
                      : 'bg-[#0a0f2c] border-[#1a1a3a]'
                  }`}
                >
                  {/* Left: Checkbox + Info */}
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedSetIds.has(set.setId)}
                      onChange={() => toggleSetSelection(set.setId)}
                      className="mt-1 w-4 h-4 rounded border-[#1a2238] bg-[#080c1a] text-[#b8860b] focus:ring-[#b8860b] accent-[#b8860b]"
                    />
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      set.type === 'hajj' ? 'bg-[#0d5e34]' : 'bg-[#7a3e00]'
                    }`}>
                      {set.type === 'hajj' ? (
                        <Plane className="h-5 w-5 text-white" />
                      ) : (
                        <Luggage className="h-5 w-5 text-white" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white">{set.setId}</h3>
                        <span className="px-2 py-0.5 bg-[#0d5e34] text-[#e0e6f0] text-xs rounded">
                          Nouveau
                        </span>
                      </div>
                      <div className="text-[#a0a8b8] text-sm flex flex-wrap gap-3">
                        <span>👤 {set.travelerName || '1 voyageur'}</span>
                        <span>🔢 {set.qrCount} QR</span>
                        <span>📅 {formatDate(set.createdAt)}</span>
                        {set.agencyName && <span>🏢 {set.agencyName}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="px-2 py-1 bg-[#0d152a] text-[#a0a8b8] text-xs rounded hidden sm:inline">
                      {set.status}
                    </span>
                    
                    {/* View Button */}
                    <button
                      onClick={() => {
                        setSelectedSet(set);
                        setShowDetailModal(true);
                      }}
                      className="w-10 h-10 rounded-lg bg-[#0d5e34] flex items-center justify-center text-white hover:bg-[#1e7e34] transition-colors"
                      title="Voir détails"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* Download ZIP Button */}
                    <button
                      onClick={() => handleDownloadSet(set)}
                      disabled={isDownloading && selectedSet?.id === set.id}
                      className="w-10 h-10 rounded-lg bg-[#b8860b] flex items-center justify-center text-white hover:bg-[#3b82f6] transition-colors disabled:opacity-50"
                      title="Télécharger ZIP"
                    >
                      {isDownloading && selectedSet?.id === set.id ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <FileArchive className="h-4 w-4" />
                      )}
                    </button>

                    {/* Share Button */}
                    <button
                      onClick={() => handleShareSet(set)}
                      className="w-10 h-10 rounded-lg bg-[#1e7e34] flex items-center justify-center text-white hover:bg-[#228b22] transition-colors"
                      title="Partager"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => {
                        setSelectedSet(set);
                        setShowDeleteModal(true);
                      }}
                      className="w-10 h-10 rounded-lg bg-[#7a1e1e] flex items-center justify-center text-white hover:bg-[#9c2727] transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 px-6 py-4 bg-[#0d152a] border border-[#1a2238] rounded-xl flex justify-between items-center">
          <span className="text-[#a0a8b8] text-sm">
            {sets.length} set(s) affiché(s)
          </span>
          <Link
            href="/admin"
            className="text-[#b8860b] text-sm hover:underline"
          >
            ← Retour au dashboard
          </Link>
        </div>
      </div>

      {/* Export ZIP Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d152a] border border-[#1a2238] rounded-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-6 border-b border-[#1a2238]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-[#1e7e34] to-[#0d5e34] rounded-lg flex items-center justify-center">
                  <Archive className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Export ZIP</h2>
                  <p className="text-[#a0a8b8] text-sm">QR codes organisés par passager</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!isExporting) {
                    setShowExportModal(false);
                    setExportProgress('');
                  }
                }}
                className="p-2 rounded-lg hover:bg-[#1a2238] transition-colors"
              >
                <X className="w-5 h-5 text-[#a0a8b8]" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Export Mode Selection */}
              <div>
                <label className="text-[#a0a8b8] text-sm mb-3 block">Mode d'export</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setExportForm(prev => ({ ...prev, mode: 'selected' }))}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      exportForm.mode === 'selected'
                        ? 'bg-[#0d5e34] border-[#0d5e34] text-white'
                        : 'bg-[#080c1a] border-[#1a2238] text-[#a0a8b8] hover:border-[#2a2a3a]'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-xs font-medium">Sélection</p>
                    <p className="text-[10px] opacity-70">{selectedSetIds.size} sets</p>
                  </button>
                  <button
                    onClick={() => setExportForm(prev => ({ ...prev, mode: 'agency' }))}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      exportForm.mode === 'agency'
                        ? 'bg-[#0d5e34] border-[#0d5e34] text-white'
                        : 'bg-[#080c1a] border-[#1a2238] text-[#a0a8b8] hover:border-[#2a2a3a]'
                    }`}
                  >
                    <Filter className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-xs font-medium">Par agence</p>
                    <p className="text-[10px] opacity-70">Tous les QR</p>
                  </button>
                  <button
                    onClick={() => setExportForm(prev => ({ ...prev, mode: 'type' }))}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      exportForm.mode === 'type'
                        ? 'bg-[#0d5e34] border-[#0d5e34] text-white'
                        : 'bg-[#080c1a] border-[#1a2238] text-[#a0a8b8] hover:border-[#2a2a3a]'
                    }`}
                  >
                    <QrCode className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-xs font-medium">Par type</p>
                    <p className="text-[10px] opacity-70">Hajj/Voyageur</p>
                  </button>
                </div>
              </div>

              {/* Agency selection */}
              {exportForm.mode === 'agency' && (
                <div>
                  <label className="text-[#a0a8b8] text-sm mb-2 block">Agence</label>
                  <select
                    value={exportForm.agencyId}
                    onChange={(e) => setExportForm(prev => ({ ...prev, agencyId: e.target.value }))}
                    className="w-full bg-[#080c1a] border border-[#1a2238] rounded-lg py-3 px-4 text-[#e0e6f0] focus:outline-none focus:border-[#b8860b]/50"
                  >
                    <option value="">Sélectionner une agence</option>
                    {exportAgencies.map(agency => (
                      <option key={agency.id} value={agency.id}>{agency.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Type selection */}
              {exportForm.mode === 'type' && (
                <div>
                  <label className="text-[#a0a8b8] text-sm mb-2 block">Type de voyage</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setExportForm(prev => ({ ...prev, type: 'hajj' }))}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        exportForm.type === 'hajj'
                          ? 'bg-[#0d5e34] border-[#0d5e34] text-white'
                          : 'bg-[#080c1a] border-[#1a2238] text-[#a0a8b8]'
                      }`}
                    >
                      <Plane className="w-5 h-5 mx-auto mb-1" />
                      <p className="text-xs font-medium">Hajj</p>
                    </button>
                    <button
                      onClick={() => setExportForm(prev => ({ ...prev, type: 'voyageur' }))}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        exportForm.type === 'voyageur'
                          ? 'bg-[#1D4ED8] border-[#1D4ED8] text-white'
                          : 'bg-[#080c1a] border-[#1a2238] text-[#a0a8b8]'
                      }`}
                    >
                      <Luggage className="w-5 h-5 mx-auto mb-1" />
                      <p className="text-xs font-medium">Voyageur</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Export Summary */}
              <div className="bg-[#080c1a] rounded-xl p-4 border border-[#1a2238]">
                <h4 className="text-[#a0a8b8] text-sm mb-2">Résumé de l'export</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#a0a8b8]">Mode</span>
                    <span className="text-white">
                      {exportForm.mode === 'selected' 
                        ? `${selectedSetIds.size} sets sélectionnés`
                        : exportForm.mode === 'agency'
                          ? exportAgencies.find(a => a.id === exportForm.agencyId)?.name || 'Non défini'
                          : exportForm.type === 'hajj' ? 'Tous les Hajj' : 'Tous les Voyageurs'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a0a8b8]">QR codes estimés</span>
                    <span className="text-white font-bold">
                      {exportForm.mode === 'selected'
                        ? selectedQrCount
                        : exportForm.mode === 'agency'
                          ? 'Tous les QR de l\'agence'
                          : exportForm.type === 'hajj'
                            ? stats.hajjSets * 3
                            : stats.voyageurSets * 3
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a0a8b8]">Format</span>
                    <span className="text-white">ZIP (PNG par passager)</span>
                  </div>
                </div>
              </div>

              {/* Structure preview */}
              <div className="bg-[#080c1a] rounded-xl p-4 border border-[#1a2238]">
                <h4 className="text-[#a0a8b8] text-sm mb-2">Structure du ZIP</h4>
                <pre className="text-[#0d5e34] text-xs leading-5 font-mono">
{`QRTags-export.zip
├── Passager-001-HAJJ-2026-ABCD/
│   ├── objet-1-cabine-HAJJ26-XXXXXX.png
│   ├── objet-2-soute-HAJJ26-YYYYYY.png
│   ├── objet-3-soute-HAJJ26-ZZZZZZ.png
│   └── README.txt
├── Passager-002-.../
│   └── ...
└── _MANIFEST.txt`}
                </pre>
              </div>

              {/* Progress */}
              {exportProgress && (
                <div className="flex items-center gap-3 px-4 py-3 bg-[#080c1a] rounded-xl border border-[#1a2238]">
                  {isExporting ? (
                    <Loader2 className="w-5 h-5 text-[#0d5e34] animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-[#0d5e34]" />
                  )}
                  <span className="text-[#e0e6f0] text-sm">{exportProgress}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (!isExporting) {
                      setShowExportModal(false);
                      setExportProgress('');
                    }
                  }}
                  disabled={isExporting}
                  className="flex-1 py-3 bg-[#1a2238] text-[#e0e6f0] rounded-lg hover:bg-[#2a2a3a] transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleExportZip}
                  disabled={isExporting}
                  className="flex-1 py-3 bg-gradient-to-r from-[#1e7e34] to-[#0d5e34] text-white rounded-lg hover:from-[#228b22] hover:to-[#1e7e34] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-green-900/30"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Export en cours...
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4" />
                      Exporter en ZIP
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSet && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d152a] border border-[#1a2238] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#1a2238]">
              <div>
                <h2 className="text-lg font-bold text-white">{selectedSet.setId}</h2>
                <p className="text-[#a0a8b8] text-sm">
                  {selectedSet.type === 'hajj' ? 'Hajj 2026' : 'Voyageur'} • {selectedSet.qrCount} QR codes
                </p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedSet(null);
                }}
                className="p-2 rounded-lg hover:bg-[#1a2238] transition-colors"
              >
                <X className="w-5 h-5 text-[#a0a8b8]" />
              </button>
            </div>
            <div className="p-6">
              {/* QR Codes Grid */}
              <div 
                ref={qrRef}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
              >
                {selectedSet.references.map((ref, index) => (
                  <div
                    key={ref}
                    className="bg-white rounded-xl p-4 text-center"
                  >
                    <QRCodeSVG
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/scan/${ref}`}
                      size={140}
                      level="H"
                      includeMargin={true}
                      bgColor="#ffffff"
                      fgColor={selectedSet.type === 'hajj' ? '#0d5e34' : '#1D4ED8'}
                    />
                    <p className="text-gray-800 font-mono font-bold mt-2 text-sm">
                      {ref}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {index === 0 ? 'Cabine' : 'Soute'} #{index + 1}
                    </p>
                  </div>
                ))}
              </div>

              {/* Info */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#0a0f2c] rounded-lg p-4">
                  <p className="text-[#a0a8b8] text-sm">Créé le</p>
                  <p className="text-white font-medium">{formatDate(selectedSet.createdAt)}</p>
                </div>
                <div className="bg-[#0a0f2c] rounded-lg p-4">
                  <p className="text-[#a0a8b8] text-sm">Agence</p>
                  <p className="text-white font-medium">{selectedSet.agencyName || 'N/A'}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => handleDownloadSet(selectedSet)}
                  className="flex-1 py-3 bg-[#b8860b] text-white rounded-lg hover:bg-[#3b82f6] transition-colors flex items-center justify-center gap-2"
                >
                  <FileArchive className="w-4 h-4" />
                  Télécharger ZIP
                </button>
                <button
                  onClick={() => handleShareSet(selectedSet)}
                  className="flex-1 py-3 bg-[#0d5e34] text-white rounded-lg hover:bg-[#1e7e34] transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Partager
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSet && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0d152a] border border-[#1a2238] rounded-xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#7a1e1e]/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Supprimer ce set ?</h3>
                  <p className="text-[#a0a8b8] text-sm">{selectedSet.setId}</p>
                </div>
              </div>
              <p className="text-[#a0a8b8] text-sm mb-6">
                Cette action supprimera définitivement les {selectedSet.qrCount} QR codes de ce set.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedSet(null);
                  }}
                  className="flex-1 py-2 px-4 bg-[#1a2238] text-[#e0e6f0] rounded-lg hover:bg-[#2a2a3a] transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteSet}
                  className="flex-1 py-2 px-4 bg-[#7a1e1e] text-white rounded-lg hover:bg-[#8a2e2e] transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
