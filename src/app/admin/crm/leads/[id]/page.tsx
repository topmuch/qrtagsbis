'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  ArrowLeft,
  Phone,
  Mail,
  Building,
  Calendar,
  User,
  Plus,
  Save,
  MessageSquare,
  Clock,
  FileText,
  PhoneCall,
  MessageCircle,
  RefreshCw
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/lib/permissions';

// Types
type LeadStatus = 'new' | 'contacted' | 'in_discussion' | 'qualified' | 'converted' | 'lost';

interface Observation {
  id: string;
  type: string;
  content: string;
  date: string;
  userId: string;
  user: {
    id: string;
    name: string | null;
  };
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  status: LeadStatus;
  source: string | null;
  notes: string | null;
  assignedToId: string | null;
  assignedTo: {
    id: string;
    name: string | null;
  } | null;
  observations: Observation[];
  createdAt: string;
  updatedAt: string;
}

interface DailyReport {
  id: string;
  content: string;
  date: string;
}

// Status configuration
const STATUS_CONFIG: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: 'Nouveau', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' },
  contacted: { label: 'Contacté', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300' },
  in_discussion: { label: 'En discussion', className: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' },
  qualified: { label: 'Qualifié', className: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300' },
  converted: { label: 'Converti', className: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300' },
  lost: { label: 'Perdu', className: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' },
};

// Observation type configuration
const OBSERVATION_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  note: { label: 'Note', icon: <FileText className="w-4 h-4" />, className: 'bg-gray-500' },
  appel: { label: 'Appel', icon: <PhoneCall className="w-4 h-4" />, className: 'bg-green-500' },
  rdv: { label: 'Rendez-vous', icon: <Calendar className="w-4 h-4" />, className: 'bg-blue-500' },
  email: { label: 'Email', icon: <Mail className="w-4 h-4" />, className: 'bg-purple-500' },
  whatsapp: { label: 'WhatsApp', icon: <MessageCircle className="w-4 h-4" />, className: 'bg-blue-600' },
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  
  const { can, user } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [observationDialogOpen, setObservationDialogOpen] = useState(false);
  
  // Observation form
  const [observationForm, setObservationForm] = useState({
    type: 'note',
    content: '',
    date: new Date().toISOString().split('T')[0],
  });
  
  // Daily report
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [dailyReportContent, setDailyReportContent] = useState('');
  const [savingReport, setSavingReport] = useState(false);
  
  const canManage = can(PERMISSIONS.MANAGE_CRM);
  
  useEffect(() => {
    fetchLead();
    if (user?.id) fetchDailyReport();
  }, [leadId, user?.id]);
  
  const fetchLead = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/crm/leads/${leadId}`);
      const data = await res.json();
      setLead(data.lead || null);
    } catch (error) {
      console.error('Error fetching lead:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDailyReport = async () => {
    if (!user?.id) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/admin/crm/daily-reports?date=${today}&userId=${user.id}`);
      const data = await res.json();
      if (data.report) {
        setDailyReport(data.report);
        setDailyReportContent(data.report.content);
      }
    } catch (error) {
      console.error('Error fetching daily report:', error);
    }
  };
  
  const handleUpdateStatus = async (status: LeadStatus) => {
    try {
      const response = await fetch('/api/admin/crm/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status }),
      });
      
      if (response.ok) {
        fetchLead();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };
  
  const handleAddObservation = async () => {
    if (!observationForm.content.trim() || !user?.id) return;
    
    try {
      const response = await fetch(`/api/admin/crm/leads/${leadId}/observations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...observationForm, userId: user.id }),
      });
      
      if (response.ok) {
        setObservationDialogOpen(false);
        setObservationForm({ type: 'note', content: '', date: new Date().toISOString().split('T')[0] });
        fetchLead();
      }
    } catch (error) {
      console.error('Error adding observation:', error);
    }
  };
  
  const handleSaveDailyReport = async () => {
    if (!dailyReportContent.trim() || !user?.id) return;
    setSavingReport(true);
    try {
      const response = await fetch('/api/admin/crm/daily-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: dailyReportContent, userId: user.id }),
      });
      
      if (response.ok) {
        fetchDailyReport();
      }
    } catch (error) {
      console.error('Error saving daily report:', error);
    } finally {
      setSavingReport(false);
    }
  };
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-slate-300 border-t-[#2563EB] rounded-full" />
        </div>
      </div>
    );
  }
  
  if (!lead) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-20">
          <p className="text-slate-500">Lead non trouvé</p>
          <Button onClick={() => router.push('/admin/crm')} className="mt-4">
            Retour au CRM
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.push('/admin/crm')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au CRM
      </button>
      
      {/* Header Card */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                {lead.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{lead.name}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {canManage ? (
                    <Select value={lead.status} onValueChange={(v) => handleUpdateStatus(v as LeadStatus)}>
                      <SelectTrigger className="w-[160px] h-9 bg-transparent border-0 p-0">
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
                  {lead.assignedTo && (
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <User className="w-4 h-4" />
                      {lead.assignedTo.name || 'Agent'}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {canManage && (
              <Button
                onClick={() => setObservationDialogOpen(true)}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une observation
              </Button>
            )}
          </div>
          
          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <a href={`mailto:${lead.email}`} className="text-sm text-blue-500 hover:underline">
                  {lead.email}
                </a>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Téléphone</p>
                {lead.phone ? (
                  <a href={`tel:${lead.phone}`} className="text-sm text-green-500 hover:underline">
                    {lead.phone}
                  </a>
                ) : (
                  <span className="text-sm text-slate-400">Non renseigné</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Entreprise</p>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {lead.company || 'Non attribué'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          {lead.notes && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-xs text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{lead.notes}</p>
            </div>
          )}
          
          {/* Created date */}
          <div className="mt-4 text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Créé le {formatDateShort(lead.createdAt)}
          </div>
        </CardContent>
      </Card>
      
      {/* Observations */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 mb-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Historique des observations ({lead.observations.length})
          </h2>
          
          {lead.observations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune observation pour ce lead</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lead.observations.map((obs) => (
                <div 
                  key={obs.id} 
                  className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-lg text-xs text-white flex items-center gap-1 ${OBSERVATION_TYPE_CONFIG[obs.type]?.className || 'bg-gray-500'}`}>
                        {OBSERVATION_TYPE_CONFIG[obs.type]?.icon}
                        {OBSERVATION_TYPE_CONFIG[obs.type]?.label || obs.type}
                      </span>
                      <span className="text-xs text-slate-500">
                        par {obs.user?.name || 'Utilisateur'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {formatDate(obs.date)}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">
                    {obs.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Daily Report */}
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Rapport journalier — {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h2>
          
          <textarea
            value={dailyReportContent}
            onChange={(e) => setDailyReportContent(e.target.value)}
            placeholder="Résumé de la journée : 3 leads contactés, 1 rendez-vous confirmé, 1 converti..."
            className="w-full h-32 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          
          <div className="flex items-center justify-between mt-4">
            {dailyReport && (
              <span className="text-xs text-slate-400">
                Dernière sauvegarde : {formatDate(dailyReport.date)}
              </span>
            )}
            <Button
              onClick={handleSaveDailyReport}
              disabled={savingReport || !dailyReportContent.trim()}
              className="bg-blue-600 hover:bg-amber-600 text-white ml-auto disabled:opacity-50"
            >
              {savingReport ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {savingReport ? 'Enregistrement...' : 'Sauvegarder le rapport'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Add Observation Dialog */}
      <Dialog open={observationDialogOpen} onOpenChange={setObservationDialogOpen}>
        <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une observation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Type d'interaction</Label>
              <Select
                value={observationForm.type}
                onValueChange={(v) => setObservationForm({ ...observationForm, type: v })}
              >
                <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <SelectItem value="note">📝 Note</SelectItem>
                  <SelectItem value="appel">📞 Appel</SelectItem>
                  <SelectItem value="rdv">📅 Rendez-vous</SelectItem>
                  <SelectItem value="email">📧 Email</SelectItem>
                  <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={observationForm.date}
                onChange={(e) => setObservationForm({ ...observationForm, date: e.target.value })}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Contenu</Label>
              <textarea
                value={observationForm.content}
                onChange={(e) => setObservationForm({ ...observationForm, content: e.target.value })}
                placeholder="Détails de l'interaction..."
                className="w-full h-24 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <Button
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              onClick={handleAddObservation}
              disabled={!observationForm.content.trim()}
            >
              Enregistrer l'observation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
