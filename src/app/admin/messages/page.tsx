'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Eye,
  CheckCircle,
  Trash2,
  Download,
  RefreshCw,
  Clock,
  Send,
  XCircle,
  MessageSquare,
  AlertCircle,
  CheckCheck,
  Inbox
} from "lucide-react";
import { AIBadge } from '@/components/ai/AIIndicators';

// Types
interface Message {
  id: string;
  type: string;
  status: string;
  subject: string | null;
  senderName: string | null;
  senderEmail: string | null;
  senderPhone: string | null;
  agencyId: string | null;
  recipientAgencyId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Type labels
const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  contact: { label: 'Contact', icon: '📩', color: 'text-blue-600 dark:text-blue-400' },
  partenaire: { label: 'Partenaire', icon: '🤝', color: 'text-violet-600 dark:text-violet-400' },
  commande_agence: { label: 'Commande', icon: '📦', color: 'text-amber-600 dark:text-blue-500' },
  assistance_agence: { label: 'Assistance', icon: '💬', color: 'text-amber-600 dark:text-blue-500' },
  reponse_assistance: { label: 'Réponse', icon: '↩️', color: 'text-blue-700 dark:text-blue-500' },
  message_superadmin: { label: 'SuperAdmin', icon: '👑', color: 'text-red-600 dark:text-red-400' },
};

// Status config
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  non_lu: { label: 'Non lu', className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  lu: { label: 'Lu', className: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
  traite: { label: 'Traité', className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-blue-500' },
};

// Format message content for display
function formatMessageContent(content: string, messageType: string): string {
  try {
    const parsed = JSON.parse(content);
    
    // Handle commande_agence type
    if (messageType === 'commande_agence') {
      const typeLabel = parsed.type === 'hajj' ? 'Hajj (3 QR/pèlerin)' : 'Voyageur (1 ou 2 QR)';
      const countLabel = parsed.type === 'hajj' ? 'pèlerins' : 'voyageurs';
      const notes = parsed.notes ? `\nNotes: ${parsed.notes}` : '';
      return `Commande: ${parsed.count} ${countLabel}\nType: ${typeLabel}${notes}`;
    }
    
    // Handle contact/partenaire types
    if (parsed.message) return parsed.message;
    if (parsed.nom) return `Nom: ${parsed.nom}${parsed.email ? `\nEmail: ${parsed.email}` : ''}${parsed.message ? `\nMessage: ${parsed.message}` : ''}`;
    
    // Default: try to extract meaningful text
    if (typeof parsed === 'string') return parsed;
    
    return content;
  } catch {
    return content;
  }
}

// AI Summary Component for messages
function MessageSummaryCell({ content, messageType }: { content: string; messageType: string }) {
  const [summary, setSummary] = useState<string>('');
  const [wasSummarized, setWasSummarized] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAIAndSummarize();
  }, [content, messageType]);

  const checkAIAndSummarize = async () => {
    // First, format the content properly
    const text = formatMessageContent(content, messageType);

    if (text.length <= 50) {
      setSummary(text);
      return;
    }

    try {
      const statusRes = await fetch('/api/ai/suggestions?status=true');
      const statusData = await statusRes.json();
      const enabled = statusData.aiStatus?.ai_message_summary === true;

      if (enabled) {
        setLoading(true);
        const res = await fetch('/api/ai/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, maxLength: 50 })
        });
        const data = await res.json();
        
        if (data.success) {
          setSummary(data.summary);
          setWasSummarized(data.wasSummarized);
        } else {
          setSummary(text.substring(0, 50) + '...');
        }
      } else {
        setSummary(text.substring(0, 50) + '...');
      }
    } catch {
      setSummary(text.substring(0, 50) + '...');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <span className="text-slate-400 dark:text-slate-500 animate-pulse">Résumé...</span>;
  }

  return (
    <span className="text-slate-700 dark:text-slate-300 text-sm flex items-center gap-1">
      {wasSummarized && (
        <span className="shrink-0">
          <AIBadge tooltip="Résumé généré par IA - Désactivable dans Paramètres" />
        </span>
      )}
      {summary}
    </span>
  );
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [typeFilter, statusFilter]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/messages?${params}`);
      const data = await res.json();
      setMessages(data.messages || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'lu' }),
      });
      fetchMessages();
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const handleMarkAsProcessed = async (id: string) => {
    try {
      await fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'traite' }),
      });
      fetchMessages();
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return;
    
    try {
      await fetch(`/api/messages?id=${id}`, {
        method: 'DELETE',
      });
      fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleExportPDF = () => {
    alert('Export PDF à implémenter');
  };

  const openMessageDetails = (message: Message) => {
    setSelectedMessage(message);
    setShowModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const parseContent = (content: string) => {
    try {
      return JSON.parse(content);
    } catch {
      return { raw: content };
    }
  };

  // Calculate stats
  const stats = {
    total: messages.length,
    unread: messages.filter(m => m.status === 'non_lu').length,
    processed: messages.filter(m => m.status === 'traite').length,
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Messages</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez vos messages et demandes</p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm px-3 py-1 rounded-full flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              {unreadCount} nouveaux
            </span>
          )}
          <Button
            onClick={fetchMessages}
            variant="outline"
            className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Total messages</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.total === 0 ? '—' : stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-[#2563EB]/10 dark:bg-[#2563EB]/20 rounded-xl flex items-center justify-center">
                <Inbox className="w-6 h-6 text-[#2563EB]" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Non lus</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.unread === 0 ? '—' : stats.unread}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Traités</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.processed === 0 ? '—' : stats.processed}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <CheckCheck className="w-6 h-6 text-blue-700 dark:text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Assistance</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white">{messages.filter(m => m.type === 'assistance_agence').length === 0 ? '—' : messages.filter(m => m.type === 'assistance_agence').length}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-amber-600 dark:text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 text-sm">Type:</span>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="contact">Contact</SelectItem>
              <SelectItem value="partenaire">Partenaire</SelectItem>
              <SelectItem value="commande_agence">Commande</SelectItem>
              <SelectItem value="assistance_agence">Assistance</SelectItem>
              <SelectItem value="reponse_assistance">Réponses</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 text-sm">Statut:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="non_lu">Non lus</SelectItem>
              <SelectItem value="lu">Lus</SelectItem>
              <SelectItem value="traite">Traités</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleExportPDF}
          variant="outline"
          className="ml-auto border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
        >
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </div>

      {/* Messages Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
            <span className="text-slate-500 dark:text-slate-400">Chargement...</span>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400">Aucun message</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {messages.map((message) => {
              const typeConfig = TYPE_LABELS[message.type] || { label: message.type, icon: '📨', color: 'text-slate-600 dark:text-slate-400' };
              const statusConfig = STATUS_CONFIG[message.status] || { label: message.status, className: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' };
              
              return (
                <div
                  key={message.id}
                  className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all ${
                    message.status === 'non_lu' ? 'ring-2 ring-red-200 dark:ring-red-800' : ''
                  }`}
                >
                  {/* Header with date + status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      {formatDate(message.createdAt)}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.className}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  {/* Sender info */}
                  <h3 className="font-semibold text-slate-800 dark:text-white mb-0.5">{message.senderName || 'Anonyme'}</h3>
                  {message.senderEmail && <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{message.senderEmail}</p>}
                  {/* Type badge */}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 mb-3 ${typeConfig.color}`}>
                    <span>{typeConfig.icon}</span>
                    {typeConfig.label}
                  </span>
                  {/* Content preview */}
                  <div className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 mb-4">
                    <MessageSummaryCell content={message.content} messageType={message.type} />
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => openMessageDetails(message)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-[#2563EB]/10 hover:text-[#2563EB] dark:hover:bg-[#2563EB]/20 dark:hover:text-[#2563EB] transition-colors"
                      title="Voir détails"
                    >
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      Détails
                    </button>
                    {message.status === 'non_lu' && (
                      <button
                        onClick={() => handleMarkAsRead(message.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-blue-700 dark:hover:bg-emerald-900/20 dark:hover:text-blue-500 transition-colors"
                        title="Marquer comme lu"
                      >
                        <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        Lu
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(message.id)}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-4 px-2 py-3 flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400 text-sm">
              {messages.length} message(s)
            </span>
          </div>
        </>
      )}

      {/* Message Details Modal */}
      {showModal && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Détails du message</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <XCircle className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Meta Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Type</p>
                  <p className="text-slate-800 dark:text-white font-medium">
                    {TYPE_LABELS[selectedMessage.type]?.icon} {TYPE_LABELS[selectedMessage.type]?.label || selectedMessage.type}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Statut</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[selectedMessage.status]?.className}`}>
                    {STATUS_CONFIG[selectedMessage.status]?.label || selectedMessage.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Nom</p>
                  <p className="text-slate-800 dark:text-white">{selectedMessage.senderName || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Email</p>
                  <p className="text-slate-800 dark:text-white">{selectedMessage.senderEmail || '—'}</p>
                </div>
              </div>

              {selectedMessage.senderPhone && (
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Téléphone</p>
                  <p className="text-slate-800 dark:text-white">{selectedMessage.senderPhone}</p>
                </div>
              )}
              
              {selectedMessage.subject && (
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Sujet</p>
                  <p className="text-slate-800 dark:text-white font-medium">{selectedMessage.subject}</p>
                </div>
              )}

              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">Contenu</p>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                  <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">
                    {formatMessageContent(selectedMessage.content, selectedMessage.type)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Date</p>
                <p className="text-slate-800 dark:text-white">{new Date(selectedMessage.createdAt).toLocaleString('fr-FR')}</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-3">
              {selectedMessage.type === 'assistance_agence' && selectedMessage.agencyId && (
                <button
                  onClick={() => {
                    setShowModal(false);
                    setShowReplyModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  Répondre à l'agence
                </button>
              )}
              {selectedMessage.senderEmail && selectedMessage.type !== 'assistance_agence' && (
                <a
                  href={`mailto:${selectedMessage.senderEmail}?subject=Re: Votre message sur QRTags`}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-xl hover:bg-[#ff9f00] transition-colors"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  Répondre par email
                </a>
              )}
              {selectedMessage.status !== 'traite' && (
                <button
                  onClick={() => {
                    handleMarkAsProcessed(selectedMessage.id);
                    setShowModal(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" aria-hidden="true" />
                  Marquer comme traité
                </button>
              )}
              <button
                onClick={() => {
                  handleDelete(selectedMessage.id);
                  setShowModal(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-lg w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Répondre à {selectedMessage.senderName || 'l\'agence'}</h2>
              <button
                onClick={() => {
                  setShowReplyModal(false);
                  setReplyContent('');
                }}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <XCircle className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Original Message */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">Message original :</p>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 border border-slate-200 dark:border-slate-600">
                <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">
                  {selectedMessage.subject && <strong className="block mb-1">{selectedMessage.subject}</strong>}
                  {formatMessageContent(selectedMessage.content, selectedMessage.type)}
                </p>
              </div>
            </div>

            {/* Reply Form */}
            <div className="p-6">
              <label className="block text-slate-500 dark:text-slate-400 text-sm mb-2">Votre réponse :</label>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={6}
                className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#2563EB] resize-none"
                placeholder="Écrivez votre réponse ici..."
              />
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowReplyModal(false);
                    setReplyContent('');
                  }}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    if (!replyContent.trim()) return;
                    setReplySubmitting(true);
                    try {
                      await fetch('/api/messages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          type: 'reponse_assistance',
                          recipientAgencyId: selectedMessage.agencyId,
                          subject: `Re: ${selectedMessage.subject || 'Votre demande d\'assistance'}`,
                          content: replyContent,
                          senderName: 'Support QRTags',
                        }),
                      });
                      
                      await fetch('/api/messages', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: selectedMessage.id, status: 'traite' }),
                      });
                      
                      setShowReplyModal(false);
                      setReplyContent('');
                      fetchMessages();
                    } catch (error) {
                      console.error('Error sending reply:', error);
                    } finally {
                      setReplySubmitting(false);
                    }
                  }}
                  disabled={replySubmitting || !replyContent.trim()}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {replySubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" aria-hidden="true" />
                      Envoyer la réponse
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
