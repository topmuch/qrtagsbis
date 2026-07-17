'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  UserPlus,
  Phone,
  Mail,
  Building,
  Search,
  Download,
  RefreshCw,
  Eye,
  Pencil,
  X
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/lib/permissions';

// Extended status type
type LeadStatus = 'new' | 'contacted' | 'in_discussion' | 'qualified' | 'converted' | 'lost';

// Types
interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: LeadStatus;
  source: string;
  notes: string;
  agencyId?: string | null;
  agency?: { name: string } | null;
  createdAt: string;
  updatedAt: string;
}

// Extended status configuration
const STATUS_CONFIG: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: 'Nouveau', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' },
  contacted: { label: 'Contacté', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300' },
  in_discussion: { label: 'En discussion', className: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' },
  qualified: { label: 'Qualifié', className: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' },
  converted: { label: 'Converti', className: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300' },
  lost: { label: 'Perdu', className: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' },
};

const SOURCE_LABELS: Record<string, string> = {
  website: 'Site web',
  referral: 'Recommandation',
  social: 'Réseaux sociaux',
  event: 'Événement',
  other: 'Autre',
};

export default function CRMPage() {
  const router = useRouter();
  const { can } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'new' as LeadStatus,
    source: '',
    notes: '',
  });

  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'new' as LeadStatus,
    source: '',
    notes: '',
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/crm/leads');
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async () => {
    try {
      const response = await fetch('/api/admin/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadForm),
      });

      const data = await response.json();

      if (response.ok) {
        fetchLeads();
        setCreateDialogOpen(false);
        setLeadForm({ name: '', email: '', phone: '', company: '', status: 'new', source: '', notes: '' });
      } else {
        alert(`Erreur: ${data.error || 'Impossible de créer le lead'}`);
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Erreur de connexion au serveur');
    }
  };

  const handleUpdateLead = async () => {
    if (!editForm.id) return;
    
    try {
      const response = await fetch('/api/admin/crm/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        fetchLeads();
        setEditDialogOpen(false);
        setSelectedLead(null);
      } else {
        alert('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const handleUpdateStatus = async (id: string, status: LeadStatus) => {
    try {
      const response = await fetch('/api/admin/crm/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });

      if (response.ok) {
        fetchLeads();
      }
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce lead ?')) return;

    try {
      const response = await fetch(`/api/admin/crm/leads?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchLeads();
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const openViewDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setViewDialogOpen(true);
  };

  const openEditDialog = (lead: Lead) => {
    setEditForm({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      status: lead.status,
      source: lead.source,
      notes: lead.notes,
    });
    setSelectedLead(lead);
    setEditDialogOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['Nom', 'Email', 'Téléphone', 'Entreprise', 'Statut', 'Source', 'Notes', 'Date'];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.email,
      lead.phone,
      lead.company || 'Non attribué',
      STATUS_CONFIG[lead.status]?.label || lead.status,
      SOURCE_LABELS[lead.source] || lead.source,
      lead.notes,
      new Date(lead.createdAt).toLocaleDateString('fr-FR'),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `crm-leads-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Filter leads - search works on name, email, company, phone
  const filteredLeads = leads.filter(lead => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchLower) ||
      lead.email.toLowerCase().includes(searchLower) ||
      lead.company.toLowerCase().includes(searchLower) ||
      lead.phone.toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const canManage = can(PERMISSIONS.MANAGE_CRM);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">CRM</h1>
            <p className="text-slate-500 dark:text-slate-400">Gestion des prospects et leads</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{leads.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Nouveaux</p>
            <p className="text-2xl font-bold text-blue-600">{leads.filter(l => l.status === 'new').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">En discussion</p>
            <p className="text-2xl font-bold text-blue-700">{leads.filter(l => l.status === 'in_discussion').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Qualifiés</p>
            <p className="text-2xl font-bold text-purple-600">{leads.filter(l => l.status === 'qualified').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Convertis</p>
            <p className="text-2xl font-bold text-green-600">{leads.filter(l => l.status === 'converted').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Perdus</p>
            <p className="text-2xl font-bold text-red-600">{leads.filter(l => l.status === 'lost').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Rechercher par nom, email, entreprise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="new">Nouveaux</SelectItem>
            <SelectItem value="contacted">Contactés</SelectItem>
            <SelectItem value="in_discussion">En discussion</SelectItem>
            <SelectItem value="qualified">Qualifiés</SelectItem>
            <SelectItem value="converted">Convertis</SelectItem>
            <SelectItem value="lost">Perdus</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={fetchLeads}
          className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>

        <Button
          variant="outline"
          onClick={handleExportCSV}
          className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>

        {canManage && (
          <Button 
            className="bg-green-500 hover:bg-green-600 text-white rounded-xl"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau lead
          </Button>
        )}
      </div>

      {/* Leads Table */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-500 dark:text-slate-400">Nom</TableHead>
                <TableHead className="text-slate-500 dark:text-slate-400">Contact</TableHead>
                <TableHead className="text-slate-500 dark:text-slate-400">Entreprise</TableHead>
                <TableHead className="text-slate-500 dark:text-slate-400">Statut</TableHead>
                <TableHead className="text-slate-500 dark:text-slate-400">Source</TableHead>
                <TableHead className="text-slate-500 dark:text-slate-400">Date</TableHead>
                <TableHead className="text-slate-500 dark:text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 dark:text-slate-400 py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 dark:text-slate-400 py-8">
                    Aucun lead trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell className="text-slate-800 dark:text-white font-medium">{lead.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                          <Mail className="w-3 h-3" />
                          {lead.email}
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-slate-400" />
                        {lead.company ? (
                          <span className="text-slate-600 dark:text-slate-300">{lead.company}</span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic text-sm">Non attribué</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {canManage ? (
                        <Select
                          value={lead.status}
                          onValueChange={(v) => handleUpdateStatus(lead.id, v as LeadStatus)}
                        >
                          <SelectTrigger className="w-[140px] h-8 bg-transparent border-0 p-0">
                            <Badge className={STATUS_CONFIG[lead.status]?.className}>
                              {STATUS_CONFIG[lead.status]?.label}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <SelectItem value="new">Nouveau</SelectItem>
                            <SelectItem value="contacted">Contacté</SelectItem>
                            <SelectItem value="in_discussion">En discussion</SelectItem>
                            <SelectItem value="qualified">Qualifié</SelectItem>
                            <SelectItem value="converted">Converti</SelectItem>
                            <SelectItem value="lost">Perdu</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={STATUS_CONFIG[lead.status]?.className}>
                          {STATUS_CONFIG[lead.status]?.label}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300">
                      {SOURCE_LABELS[lead.source] || lead.source || '-'}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300 text-sm">
                      {new Date(lead.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg h-8 w-8 p-0"
                          onClick={() => router.push(`/admin/crm/leads/${lead.id}`)}
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canManage && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-600 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-blue-600/10 rounded-lg h-8 w-8 p-0"
                              onClick={() => openEditDialog(lead)}
                              title="Modifier"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg h-8 w-8 p-0"
                              onClick={() => handleDeleteLead(lead.id)}
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Lead Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                placeholder="Jean Dupont"
                value={leadForm.name}
                onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="email@exemple.com"
                value={leadForm.email}
                onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                placeholder="+33 6 12 34 56 78"
                value={leadForm.phone}
                onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Entreprise</Label>
              <Input
                placeholder="Nom de l'entreprise"
                value={leadForm.company}
                onChange={(e) => setLeadForm({ ...leadForm, company: e.target.value })}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select
                value={leadForm.source}
                onValueChange={(v) => setLeadForm({ ...leadForm, source: v })}
              >
                <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <SelectItem value="website">Site web</SelectItem>
                  <SelectItem value="referral">Recommandation</SelectItem>
                  <SelectItem value="social">Réseaux sociaux</SelectItem>
                  <SelectItem value="event">Événement</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                placeholder="Notes additionnelles..."
                value={leadForm.notes}
                onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
            <Button
              className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl"
              onClick={handleCreateLead}
              disabled={!leadForm.name || !leadForm.email}
            >
              Ajouter le lead
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Lead Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Détails du lead</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {selectedLead.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-lg">{selectedLead.name}</p>
                  <Badge className={STATUS_CONFIG[selectedLead.status]?.className}>
                    {STATUS_CONFIG[selectedLead.status]?.label}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <a href={`mailto:${selectedLead.email}`} className="text-blue-500 hover:underline">
                    {selectedLead.email}
                  </a>
                </div>
                {selectedLead.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <a href={`tel:${selectedLead.phone}`} className="text-blue-500 hover:underline">
                      {selectedLead.phone}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span>{selectedLead.company || 'Non attribué'}</span>
                </div>
              </div>

              {selectedLead.notes && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Notes</p>
                  <p className="text-sm">{selectedLead.notes}</p>
                </div>
              )}

              <div className="text-xs text-slate-400 flex justify-between">
                <span>Créé: {new Date(selectedLead.createdAt).toLocaleDateString('fr-FR')}</span>
                <span>Source: {SOURCE_LABELS[selectedLead.source] || selectedLead.source || 'N/A'}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Lead Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Entreprise</Label>
              <Input
                value={editForm.company}
                onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) => setEditForm({ ...editForm, status: v as LeadStatus })}
              >
                <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <SelectItem value="new">Nouveau</SelectItem>
                  <SelectItem value="contacted">Contacté</SelectItem>
                  <SelectItem value="in_discussion">En discussion</SelectItem>
                  <SelectItem value="qualified">Qualifié</SelectItem>
                  <SelectItem value="converted">Converti</SelectItem>
                  <SelectItem value="lost">Perdu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select
                value={editForm.source}
                onValueChange={(v) => setEditForm({ ...editForm, source: v })}
              >
                <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <SelectItem value="website">Site web</SelectItem>
                  <SelectItem value="referral">Recommandation</SelectItem>
                  <SelectItem value="social">Réseaux sociaux</SelectItem>
                  <SelectItem value="event">Événement</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
            <Button
              className="w-full bg-blue-600 hover:bg-amber-600 text-white rounded-xl"
              onClick={handleUpdateLead}
            >
              Enregistrer les modifications
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
