'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  Building2,
  RefreshCw,
  Mail,
  Phone,
  Users,
  Loader2,
  Eye,
  Palette,
  CreditCard,
  Search,
} from "lucide-react";
import { AGENCY_TYPES, type AgencyType as AgencyTypeEnum } from '@/lib/agency-types';

// Types
interface Agency {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  agencyTypeId?: string;
  agencyType?: { id: string; name: string; label: string; color: string } | null;
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
  subscription?: { plan: string; status: string } | null;
  createdAt: string;
  _count?: {
    tags: number;
    users: number;
  };
}

const SUB_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  trial: { label: 'Essai', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  past_due: { label: 'En retard', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

export default function AgencesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [agencyCreating, setAgencyCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editAgencyId, setEditAgencyId] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    active: true,
    agencyTypeId: '',
    primaryColor: '#2563EB',
    secondaryColor: '#F59E0B',
  });

  const [agencyForm, setAgencyForm] = useState({
    name: '',
    slug: '',
    email: '',
    phone: '',
    agencyTypeId: 'hotel',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/agencies');
      const data = await res.json();
      setAgencies(data.agencies || []);
    } catch (error) {
      console.error('Error fetching agencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgency = async () => {
    if (!agencyForm.email) {
      setErrorMessage("L'email est obligatoire");
      return;
    }
    if (!agencyForm.password || agencyForm.password.length < 8) {
      setErrorMessage('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (agencyForm.password !== agencyForm.confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas');
      return;
    }

    setAgencyCreating(true);
    setErrorMessage('');

    try {
      const agencyResponse = await fetch('/api/admin/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agencyForm.name,
          slug: agencyForm.slug,
          email: agencyForm.email,
          phone: agencyForm.phone,
          agencyTypeId: agencyForm.agencyTypeId,
        }),
      });

      if (agencyResponse.ok) {
        const agencyData = await agencyResponse.json();

        // Create agency user
        const userResponse = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: agencyForm.email,
            name: agencyForm.name,
            password: agencyForm.password,
            role: 'agency',
            agencyId: agencyData.agency.id,
          }),
        });

        if (userResponse.ok) {
          setSuccessMessage('Agence créée avec succès !');
          setAgencyForm({ name: '', slug: '', email: '', phone: '', agencyTypeId: 'hotel', password: '', confirmPassword: '' });
          setDialogOpen(false);
          fetchAgencies();
        } else {
          setErrorMessage('Agence créée mais erreur lors de la création de l\'utilisateur');
        }
      } else {
        const data = await agencyResponse.json();
        setErrorMessage(data.error || 'Erreur lors de la création');
      }
    } catch {
      setErrorMessage('Erreur de connexion');
    } finally {
      setAgencyCreating(false);
    }
  };

  const handleEdit = (agency: Agency) => {
    setEditAgencyId(agency.id);
    setEditForm({
      name: agency.name,
      slug: agency.slug,
      email: agency.email || '',
      phone: agency.phone || '',
      active: agency.active,
      agencyTypeId: agency.agencyType?.id || '',
      primaryColor: agency.primaryColor || '#2563EB',
      secondaryColor: agency.secondaryColor || '#F59E0B',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editAgencyId) return;
    setEditSaving(true);
    try {
      const res = await fetch('/api/admin/agencies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editAgencyId, ...editForm }),
      });
      if (res.ok) {
        setEditDialogOpen(false);
        fetchAgencies();
      }
    } catch {
      console.error('Error saving agency');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette agence ?')) return;
    try {
      const res = await fetch(`/api/admin/agencies?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchAgencies();
    } catch (error) {
      console.error('Error deleting agency:', error);
    }
  };

  const filteredAgencies = agencies.filter(a => {
    const matchesSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || a.agencyType?.name === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Agences</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez les agences partenaires QRTags</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={fetchAgencies}
            variant="outline"
            className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle agence
            </Button>
            <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-slate-800 dark:text-white">Créer une agence</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
                <div className="space-y-2">
                  <Label>Nom *</Label>
                  <Input value={agencyForm.name} onChange={(e) => setAgencyForm({ ...agencyForm, name: e.target.value })} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={agencyForm.slug} onChange={(e) => setAgencyForm({ ...agencyForm, slug: e.target.value })} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Type d&apos;agence *</Label>
                  <Select value={agencyForm.agencyTypeId} onValueChange={(v) => setAgencyForm({ ...agencyForm, agencyTypeId: v })}>
                    <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      {Object.entries(AGENCY_TYPES).map(([key, def]) => (
                        <SelectItem key={key} value={key}>{def.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" value={agencyForm.email} onChange={(e) => setAgencyForm({ ...agencyForm, email: e.target.value })} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input value={agencyForm.phone} onChange={(e) => setAgencyForm({ ...agencyForm, phone: e.target.value })} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Mot de passe *</Label>
                  <Input type="password" value={agencyForm.password} onChange={(e) => setAgencyForm({ ...agencyForm, password: e.target.value })} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Confirmer le mot de passe *</Label>
                  <Input type="password" value={agencyForm.confirmPassword} onChange={(e) => setAgencyForm({ ...agencyForm, confirmPassword: e.target.value })} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl" />
                </div>
                <Button onClick={handleCreateAgency} disabled={agencyCreating} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">
                  {agencyCreating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Création...</> : 'Créer l\'agence'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300">
          {successMessage}
        </div>
      )}

      {/* Filters */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full lg:w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                <SelectValue placeholder="Par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.entries(AGENCY_TYPES).map(([key, def]) => (
                  <SelectItem key={key} value={key}>{def.name}</SelectItem>
                ))}
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
      ) : filteredAgencies.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Aucune agence trouvée</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-700">
                  <TableHead>Agence</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Abonnement</TableHead>
                  <TableHead>White-label</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgencies.map((agency) => {
                  const subConf = SUB_STATUS_CONFIG[agency.subscription?.status || ''] || SUB_STATUS_CONFIG.trial;
                  return (
                    <TableRow key={agency.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableCell>
                        <div>
                          <span className="font-medium text-slate-800 dark:text-white">{agency.name}</span>
                          <p className="text-xs text-slate-500">{agency.email || '—'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className="text-xs"
                          style={agency.agencyType?.color ? {
                            backgroundColor: `${agency.agencyType.color}15`,
                            color: agency.agencyType.color,
                          } : undefined}
                        >
                          {agency.agencyType?.label || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {agency.subscription ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">{PLAN_LABELS[agency.subscription.plan] || agency.subscription.plan}</span>
                            <Badge className={subConf.className}>{subConf.label}</Badge>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Aucun</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-5 h-5 rounded-md border border-slate-200 dark:border-slate-600" style={{ backgroundColor: agency.primaryColor || '#2563EB' }} />
                            <div className="w-5 h-5 rounded-md border border-slate-200 dark:border-slate-600" style={{ backgroundColor: agency.secondaryColor || '#F59E0B' }} />
                          </div>
                          {agency.logoUrl && (
                            <img src={agency.logoUrl} alt="" className="w-5 h-5 rounded object-cover" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{agency._count?.tags ?? 0}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={agency.active
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                        }>
                          {agency.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(agency)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-emerald-600 transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {!agency.onboardingCompleted && (
                            <button
                              className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-500 hover:text-amber-600 transition-colors"
                              title={`Onboarding - étape ${agency.onboardingStep || 0}`}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(agency.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-600 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <span className="text-sm text-slate-500">{filteredAgencies.length} agence(s)</span>
          </div>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-white">Modifier l&apos;agence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Type d&apos;agence</Label>
              <Input value={editForm.agencyTypeId} onChange={(e) => setEditForm({ ...editForm, agencyTypeId: e.target.value })} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Couleur primaire</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={editForm.primaryColor} onChange={(e) => setEditForm({ ...editForm, primaryColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                  <Input value={editForm.primaryColor} onChange={(e) => setEditForm({ ...editForm, primaryColor: e.target.value })} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Couleur secondaire</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={editForm.secondaryColor} onChange={(e) => setEditForm({ ...editForm, secondaryColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer" />
                  <Input value={editForm.secondaryColor} onChange={(e) => setEditForm({ ...editForm, secondaryColor: e.target.value })} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl" />
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={editForm.active} onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })} className="rounded" />
              <span className="text-sm text-slate-700 dark:text-slate-300">Agence active</span>
            </label>
            <Button onClick={handleSaveEdit} disabled={editSaving} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">
              {editSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sauvegarde...</> : 'Enregistrer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
