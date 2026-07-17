'use client';

import { useState, useEffect } from 'react';
import {
  MessageCircle,
  Send,
  Phone,
  Mail,
  MapPin,
  Clock,
  HelpCircle,
  CheckCircle,
  RefreshCw,
  Inbox
} from "lucide-react";
import { useAgency } from '../layout';

interface Message {
  id: string;
  type: string;
  status: string;
  subject: string | null;
  content: string;
  senderName: string | null;
  createdAt: string;
}

export default function AssistancePage() {
  const { agencyId, agencyName, agencyData } = useAgency();
  const [form, setForm] = useState({
    subject: '',
    message: '',
    priority: 'normal'
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'new' | 'sent' | 'replies'>('new');

  useEffect(() => {
    fetchMessages();
  }, [agencyId]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const sentRes = await fetch(`/api/agency/messages?agencyId=${agencyId}&type=assistance_agence`);
      const sentData = await sentRes.json();
      const repliesRes = await fetch(`/api/agency/messages?agencyId=${agencyId}&type=reponse_assistance`);
      const repliesData = await repliesRes.json();
      const allMessages = [
        ...(sentData.messages || []),
        ...(repliesData.messages || [])
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMessages(allMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/agency/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'assistance_agence',
          agencyId: agencyId,
          senderName: agencyName,
          subject: form.subject,
          content: JSON.stringify({
            message: form.message,
            priority: form.priority,
            agencyName: agencyName,
            agencyEmail: agencyData?.email
          })
        })
      });
      if (response.ok) {
        setSuccess(true);
        setForm({ subject: '', message: '', priority: 'normal' });
        fetchMessages();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const contactInfo = [
    { icon: <Phone className="w-5 h-5" />, title: "Téléphone", value: "+221 33 123 45 67", subtitle: "Lun-Ven, 9h-18h" },
    { icon: <Mail className="w-5 h-5" />, title: "Email", value: "support@qrtags.com", subtitle: "Réponse sous 24h" },
    { icon: <MapPin className="w-5 h-5" />, title: "Adresse", value: "Dakar, Sénégal", subtitle: "Siège social" }
  ];

  const faqItems = [
    { question: "Comment activer un tag ?", answer: "Accédez à la section 'Activations' et entrez le numéro de série du tag, puis remplissez les informations." },
    { question: "Que faire si un objet est perdu ?", answer: "Accédez à la section 'Objets perdus' de votre tableau de bord et déclarez l'objet comme perdu." },
    { question: "Comment générer plus de tags ?", answer: "Utilisez le bouton 'Générer des Tags' sur votre tableau de bord pour créer de nouveaux tags." }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const parseContent = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      return parsed.message || parsed.nom || content;
    } catch {
      return content;
    }
  };

  const sentMessages = messages.filter(m => m.type === 'assistance_agence');
  const replies = messages.filter(m => m.type === 'reponse_assistance');

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Assistance</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Notre équipe est là pour vous aider</p>
        </div>
        <button
          onClick={fetchMessages}
          className="p-2 text-slate-500 hover:text-[#10B981] hover:bg-[#10B981]/10 rounded-xl transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'new' as const, label: 'Nouveau message', icon: <Send className="w-4 h-4" /> },
          { key: 'sent' as const, label: `Mes messages (${sentMessages.length})`, icon: <Inbox className="w-4 h-4" /> },
          { key: 'replies' as const, label: `Réponses (${replies.length})`, icon: <MessageCircle className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === tab.key
                ? 'bg-[#10B981] text-white shadow-lg'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* New Message Form */}
      {activeTab === 'new' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-[#10B981]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Envoyer un message</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Nous vous répondrons dans les plus brefs délais</p>
                </div>
              </div>

              {success && (
                <div className="mb-6 p-4 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#10B981]" />
                  <span className="text-[#10B981]">Message envoyé avec succès !</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sujet</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Objet de votre demande"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Priorité</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
                  >
                    <option value="low">Basse</option>
                    <option value="normal">Normale</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Message</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Décrivez votre problème ou votre question..."
                    rows={5}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#10B981] text-white py-3 rounded-xl font-medium hover:bg-[#059669] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Envoi en cours...</>
                  ) : (
                    <><Send className="w-4 h-4" />Envoyer le message</>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Nous contacter</h3>
              <div className="space-y-4">
                {contactInfo.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#10B981]">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{item.title}</p>
                      <p className="text-slate-800 dark:text-white font-medium">{item.value}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{item.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#10B981] to-[#059669] rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5" />
                <h3 className="font-semibold">Horaires d&apos;assistance</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-white/80">Lundi - Vendredi</span><span className="font-medium">9h00 - 18h00</span></div>
                <div className="flex justify-between"><span className="text-white/80">Samedi</span><span className="font-medium">9h00 - 12h00</span></div>
                <div className="flex justify-between"><span className="text-white/80">Dimanche</span><span className="font-medium">Fermé</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sent Messages Tab */}
      {activeTab === 'sent' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500">Chargement...</p>
            </div>
          ) : sentMessages.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Aucun message envoyé</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {sentMessages.map((msg) => (
                <div key={msg.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-slate-800 dark:text-white">{msg.subject || 'Sans sujet'}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      msg.status === 'non_lu' ? 'bg-red-100 text-red-700' :
                      msg.status === 'lu' ? 'bg-[#10B981]/10 text-[#10B981]' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {msg.status === 'non_lu' ? 'Non lu' : msg.status === 'lu' ? 'Lu' : 'Traité'}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-2">{parseContent(msg.content)}</p>
                  <p className="text-slate-400 text-xs mt-2">{formatDate(msg.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Replies Tab */}
      {activeTab === 'replies' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500">Chargement...</p>
            </div>
          ) : replies.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Aucune réponse pour le moment</p>
              <p className="text-slate-400 text-sm mt-2">Les réponses du support apparaîtront ici</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {replies.map((msg) => (
                <div key={msg.id} className="p-6 bg-[#10B981]/5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#10B981] flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-sm">SA</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-800 dark:text-white">Support QRTags</h3>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-[#10B981]/10 text-[#10B981]">Réponse</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-sm">
                        {msg.subject && <strong className="block mb-1">{msg.subject}</strong>}
                        {parseContent(msg.content)}
                      </p>
                      <p className="text-slate-400 text-xs mt-2">{formatDate(msg.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
