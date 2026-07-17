'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  MousePointer,
  Image as ImageIcon,
  Calendar,
  Target,
  RefreshCw,
  X,
  Save,
  Play,
  Pause,
  AlertCircle,
  TrendingUp,
  Users,
  Building2,
  Globe
} from "lucide-react";

interface Advertisement {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
  linkTarget: string;
  position: string;
  targetScope: string;
  agencyId: string | null;
  startDate: string;
  endDate: string | null;
  status: string;
  priority: number;
  impressions: number;
  clicks: number;
  createdAt: string;
  updatedAt: string;
  _count?: { adImpressions: number };
}

interface Agency {
  id: string;
  name: string;
}

interface ApiResponse {
  advertisements: Advertisement[];
  agencies: Agency[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface StatsSummary {
  totalAds: number;
  activeAds: number;
  totalImpressions: number;
  totalClicks: number;
  avgCtr: string;
}

interface TopAd {
  id: string;
  title: string;
  impressions: number;
  clicks: number;
  ctr: string;
}

export default function PublicitesPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [agencyFilter, setAgencyFilter] = useState('all');
  const [page, setPage] = useState(1);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: '',
    linkTarget: '_blank',
    position: 'footer',
    targetScope: 'all',
    agencyId: '',
    startDate: '',
    endDate: '',
    status: 'draft',
    priority: 0
  });
  
  // Stats
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [topAds, setTopAds] = useState<TopAd[]>([]);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    fetchAdvertisements();
    fetchStats();
  }, [statusFilter, agencyFilter, page]);

  const fetchAdvertisements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (agencyFilter !== 'all') params.append('agencyId', agencyFilter);
      params.append('page', String(page));
      params.append('limit', '10');

      const response = await fetch(`/api/admin/advertisements?${params}`);
      const result = await response.json();
      
      if (result.advertisements) {
        setData(result);
        setAgencies(result.agencies || []);
      }
    } catch (error) {
      console.error('Error fetching advertisements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/advertisements/stats');
      const result = await response.json();
      if (result.summary) {
        setStats(result.summary);
        setTopAds(result.topAds || []);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedAd(null);
    setFormData({
      title: '',
      description: '',
      imageUrl: '',
      linkUrl: '',
      linkTarget: '_blank',
      position: 'footer',
      targetScope: 'all',
      agencyId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'draft',
      priority: 0
    });
    setShowModal(true);
  };

  const openEditModal = (ad: Advertisement) => {
    setModalMode('edit');
    setSelectedAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || '',
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl || '',
      linkTarget: ad.linkTarget,
      position: ad.position || 'footer',
      targetScope: ad.targetScope,
      agencyId: ad.agencyId || '',
      startDate: new Date(ad.startDate).toISOString().split('T')[0],
      endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : '',
      status: ad.status,
      priority: ad.priority
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.imageUrl || !formData.startDate) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSaving(true);
    try {
      const url = '/api/admin/advertisements';
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const body = modalMode === 'create' 
        ? formData 
        : { id: selectedAd?.id, ...formData };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setShowModal(false);
        fetchAdvertisements();
        fetchStats();
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving advertisement:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette publicité ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/advertisements?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchAdvertisements();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting advertisement:', error);
    }
  };

  const toggleStatus = async (ad: Advertisement) => {
    const newStatus = ad.status === 'active' ? 'paused' : 'active';
    
    try {
      const response = await fetch('/api/admin/advertisements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ad.id,
          ...ad,
          status: newStatus
        })
      });

      if (response.ok) {
        fetchAdvertisements();
        fetchStats();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
      active: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-blue-500', icon: Play },
      paused: { bg: 'bg-amber-100 dark:bg-blue-900/30', text: 'text-amber-700 dark:text-blue-500', icon: Pause },
      draft: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-400', icon: Edit },
      expired: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: AlertCircle }
    };
    
    const style = styles[status] || styles.draft;
    const Icon = style.icon;
    const labels: Record<string, string> = {
      active: 'Active',
      paused: 'En pause',
      draft: 'Brouillon',
      expired: 'Expirée'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${style.bg} ${style.text}`}>
        <Icon className="w-3 h-3" />
        {labels[status] || status}
      </span>
    );
  };

  const getTargetBadge = (scope: string, agencyId: string | null) => {
    if (scope === 'all') {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
          <Globe className="w-3 h-3" />
          Toutes les agences
        </span>
      );
    }
    if (scope === 'agents') {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
          <Users className="w-3 h-3" />
          Agents commerciaux
        </span>
      );
    }
    if (scope === 'agency' && agencyId) {
      const agency = agencies.find(a => a.id === agencyId);
      return (
        <span className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
          <Building2 className="w-3 h-3" />
          {agency?.name || 'Agence spécifique'}
        </span>
      );
    }
    return null;
  };

  const calculateCtr = (ad: Advertisement) => {
    if (ad.impressions === 0) return '0.00';
    return ((ad.clicks / ad.impressions) * 100).toFixed(2);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestion des Publicités</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Créez et gérez les bannières publicitaires pour les agences</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowStats(!showStats)}
            variant="outline"
            className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Statistiques
          </Button>
          <Button
            onClick={openCreateModal}
            className="bg-[#2563EB] hover:bg-[#2563EB]/90 text-white rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle publicité
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className={`grid gap-4 mb-8 ${showStats ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
          <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.totalAds}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Total</p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-800 shadow-sm rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-500">{stats.activeAds}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Actives</p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalImpressions.toLocaleString()}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Impressions</p>
            </CardContent>
          </Card>
          <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.totalClicks.toLocaleString()}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Clics</p>
            </CardContent>
          </Card>
          {showStats && (
            <Card className="bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-800 shadow-sm rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-amber-600 dark:text-blue-500">{stats.avgCtr}%</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">CTR Moyen</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Top Ads */}
      {showStats && topAds.length > 0 && (
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl mb-8">
          <CardContent className="p-5">
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Top 3 Publicités par Clics
            </h3>
            <div className="space-y-3">
              {topAds.map((ad, index) => (
                <div key={ad.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-amber-100 text-amber-700' :
                      index === 1 ? 'bg-slate-200 text-slate-600' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="text-slate-800 dark:text-white font-medium">{ad.title}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-500 dark:text-slate-400">
                      {ad.impressions.toLocaleString()} imp.
                    </span>
                    <span className="text-purple-600 dark:text-purple-400 font-medium">
                      {ad.clicks.toLocaleString()} clics
                    </span>
                    <span className="text-blue-700 dark:text-blue-500 font-medium">
                      {ad.ctr}% CTR
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actives</SelectItem>
            <SelectItem value="paused">En pause</SelectItem>
            <SelectItem value="draft">Brouillons</SelectItem>
            <SelectItem value="expired">Expirées</SelectItem>
          </SelectContent>
        </Select>

        <Select value={agencyFilter} onValueChange={(v) => { setAgencyFilter(v); setPage(1); }}>
          <SelectTrigger className="w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
            <SelectValue placeholder="Agence" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les agences</SelectItem>
            {agencies.map(agency => (
              <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={() => { fetchAdvertisements(); fetchStats(); }}
          variant="ghost"
          size="sm"
          className="text-slate-500 dark:text-slate-400"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Advertisements Table */}
      <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Publicité
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Cible
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Dates
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Stats
                </th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : data?.advertisements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                      <p className="text-slate-500 dark:text-slate-400">Aucune publicité trouvée</p>
                      <Button
                        onClick={openCreateModal}
                        variant="link"
                        className="text-[#2563EB] mt-2"
                      >
                        Créer la première publicité
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.advertisements.map((ad) => (
                  <tr key={ad.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0">
                          {ad.imageUrl ? (
                            <img 
                              src={ad.imageUrl} 
                              alt={ad.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">{ad.title}</p>
                          {ad.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                              {ad.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {getTargetBadge(ad.targetScope, ad.agencyId)}
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(ad.status)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm">
                        <p className="text-slate-800 dark:text-white">
                          {new Date(ad.startDate).toLocaleDateString('fr-FR')}
                        </p>
                        {ad.endDate && (
                          <p className="text-slate-500 dark:text-slate-400 text-xs">
                            → {new Date(ad.endDate).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                          <Eye className="w-3 h-3" />
                          {ad.impressions.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                          <MousePointer className="w-3 h-3" />
                          {ad.clicks.toLocaleString()}
                        </span>
                        <span className="text-blue-700 dark:text-blue-500 font-medium">
                          {calculateCtr(ad)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => toggleStatus(ad)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title={ad.status === 'active' ? 'Mettre en pause' : 'Activer'}
                        >
                          {ad.status === 'active' ? (
                            <Pause className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Play className="w-4 h-4 text-blue-600" />
                          )}
                        </Button>
                        <Button
                          onClick={() => openEditModal(ad)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4 text-slate-500" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(ad.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Affichage de {((page - 1) * 10) + 1} à {Math.min(page * 10, data.pagination.total)} sur {data.pagination.total}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                variant="outline"
                size="sm"
                className="rounded-lg"
              >
                Précédent
              </Button>
              <Button
                onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                variant="outline"
                size="sm"
                className="rounded-lg"
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  {modalMode === 'create' ? 'Nouvelle publicité' : 'Modifier la publicité'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-5">
                {/* Title */}
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Titre *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Offre spéciale Hajj 2026"
                    className="mt-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description courte de l'offre..."
                    rows={2}
                    className="mt-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">URL de l'image *</Label>
                  <Input
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://exemple.com/banniere.jpg"
                    className="mt-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  />
                  {formData.imageUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 h-24">
                      <img 
                        src={formData.imageUrl} 
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Link URL */}
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">URL du lien (optionnel)</Label>
                  <Input
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    placeholder="https://exemple.com/offre"
                    className="mt-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  />
                </div>

                {/* Position - Fixed to footer only */}
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Emplacement</Label>
                  <div className="mt-1 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#2563EB]/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-300">Footer (Bas de page)</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Affiché en bas du tableau de bord agence</p>
                      </div>
                    </div>
                  </div>
                  <input type="hidden" value="footer" name="position" />
                </div>

                {/* Target Scope */}
                <div>
                  <Label className="text-slate-700 dark:text-slate-300">Ciblage</Label>
                  <Select 
                    value={formData.targetScope} 
                    onValueChange={(v) => setFormData({ ...formData, targetScope: v, agencyId: '' })}
                  >
                    <SelectTrigger className="mt-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Toutes les agences
                        </div>
                      </SelectItem>
                      <SelectItem value="agents">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Agents commerciaux uniquement
                        </div>
                      </SelectItem>
                      <SelectItem value="agency">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Agence spécifique
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Agency Selection */}
                {formData.targetScope === 'agency' && (
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Sélectionner l'agence</Label>
                    <Select 
                      value={formData.agencyId} 
                      onValueChange={(v) => setFormData({ ...formData, agencyId: v })}
                    >
                      <SelectTrigger className="mt-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder="Choisir une agence" />
                      </SelectTrigger>
                      <SelectContent>
                        {agencies.map(agency => (
                          <SelectItem key={agency.id} value={agency.id}>{agency.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Date de début *</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="mt-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Date de fin</Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="mt-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>

                {/* Status and Priority */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Statut</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(v) => setFormData({ ...formData, status: v })}
                    >
                      <SelectTrigger className="mt-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">En pause</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-700 dark:text-slate-300">Priorité</Label>
                    <Input
                      type="number"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                      className="mt-1 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Plus élevé = affichage prioritaire
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="border-slate-200 dark:border-slate-700"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#2563EB] hover:bg-[#2563EB]/90 text-white"
                >
                  {saving ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
