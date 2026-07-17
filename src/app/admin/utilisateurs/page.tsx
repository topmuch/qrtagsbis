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
  Users,
  Search,
  RefreshCw,
  Filter,
} from "lucide-react";

// Types
interface Agency {
  id: string;
  name: string;
  agencyType?: { name: string; label: string } | null;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  staffRole: string | null;
  agencyId: string | null;
  agency: {
    name: string;
  } | null;
  createdAt: string;
}

const STAFF_ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  receptionniste: { label: 'Réceptionniste', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  housekeeping: { label: 'Housekeeping', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  securite: { label: 'Sécurité', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  agent: { label: 'Agent', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
};

const ROLE_BADGES: Record<string, { label: string; className: string }> = {
  superadmin: { label: 'SuperAdmin', className: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' },
  admin: { label: 'Admin', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' },
  staff: { label: 'Personnel', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
  agent: { label: 'Agent', className: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300' },
  agency: { label: 'Agence', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' },
};

export default function UtilisateursPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [agencyTypeFilter, setAgencyTypeFilter] = useState('all');

  const [userForm, setUserForm] = useState({
    email: '',
    name: '',
    password: '',
    role: 'agent',
    agencyId: '',
    staffRole: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchAgencies();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgencies = async () => {
    try {
      const res = await fetch('/api/admin/agencies');
      const data = await res.json();
      setAgencies(data.agencies || []);
    } catch (error) {
      console.error('Error fetching agencies:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });

      if (response.ok) {
        fetchUsers();
        setDialogOpen(false);
        setUserForm({ email: '', name: '', password: '', role: 'agent', agencyId: '', staffRole: '' });
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      const response = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const getRoleBadge = (role: string, staffRole?: string | null) => {
    const config = ROLE_BADGES[role] || { label: role, className: 'bg-slate-100 text-slate-600' };

    return (
      <div className="flex items-center gap-1.5">
        <Badge className={config.className}>{config.label}</Badge>
        {role === 'staff' && staffRole && STAFF_ROLE_CONFIG[staffRole] && (
          <Badge className={STAFF_ROLE_CONFIG[staffRole].className}>
            {STAFF_ROLE_CONFIG[staffRole].label}
          </Badge>
        )}
      </div>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !search || user.name?.toLowerCase().includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesAgencyType = agencyTypeFilter === 'all' || (user as User & { agency?: Agency | null }).agency?.agencyType?.name === agencyTypeFilter;
    return matchesSearch && matchesRole && matchesAgencyType;
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Utilisateurs</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez les utilisateurs et leurs accès</p>
        </div>
        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvel utilisateur
        </Button>
      </div>

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
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full lg:w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                <SelectValue placeholder="Par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="superadmin">SuperAdmin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Personnel</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="agency">Agence</SelectItem>
              </SelectContent>
            </Select>
            <Select value={agencyTypeFilter} onValueChange={setAgencyTypeFilter}>
              <SelectTrigger className="w-full lg:w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                <SelectValue placeholder="Par type d'agence" />
              </SelectTrigger>
              <SelectContent>
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
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <span className="text-slate-500 dark:text-slate-400">Chargement...</span>
          </div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400">Aucun utilisateur</p>
        </div>
      ) : (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-700">
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Agence</TableHead>
                  <TableHead>Inscrit le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell>
                      <div>
                        <span className="font-medium text-slate-800 dark:text-white">{user.name || 'Sans nom'}</span>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role, user.staffRole)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600 dark:text-slate-300">{user.agency?.name || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-500">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <span className="text-sm text-slate-500">{filteredUsers.length} utilisateur(s)</span>
          </div>
        </Card>
      )}

      {/* Create User Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white">
          <DialogHeader>
            <DialogTitle>Créer un utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nom</Label>
              <Input
                placeholder="Jean Dupont"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="email@exemple.com"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Mot de passe *</Label>
              <Input
                type="password"
                placeholder="Mot de passe"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select
                value={userForm.role}
                onValueChange={(v) => setUserForm({ ...userForm, role: v, staffRole: v === 'staff' ? 'receptionniste' : '' })}
              >
                <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="staff">Personnel</SelectItem>
                  <SelectItem value="agency">Agence</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">SuperAdmin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {userForm.role === 'staff' && (
              <div className="space-y-2">
                <Label>Rôle du personnel</Label>
                <Select
                  value={userForm.staffRole}
                  onValueChange={(v) => setUserForm({ ...userForm, staffRole: v })}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <SelectItem value="receptionniste">Réceptionniste</SelectItem>
                    <SelectItem value="housekeeping">Housekeeping</SelectItem>
                    <SelectItem value="securite">Sécurité</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {(userForm.role === 'agency' || userForm.role === 'staff') && (
              <div className="space-y-2">
                <Label>Agence</Label>
                <Select
                  value={userForm.agencyId}
                  onValueChange={(v) => setUserForm({ ...userForm, agencyId: v })}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                    <SelectValue placeholder="Sélectionner une agence" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    {agencies.map((agency) => (
                      <SelectItem key={agency.id} value={agency.id}>
                        {agency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
              onClick={handleCreateUser}
            >
              Créer l&apos;utilisateur
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
