'use client';

import { useState } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/public/PublicLayout';
import { Button } from "@/components/ui/button";
import {
  Mail,
  Phone,
  MapPinned,
  CheckCircle,
  Clock,
  MessageCircle
} from "lucide-react";

function ContactContent() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contact',
          senderName: formData.name,
          senderEmail: formData.email,
          content: { subject: formData.subject, message: formData.message },
        }),
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Hero section */}
      <section className="text-center py-16 bg-gradient-to-r from-[#080c1a] via-[#1e3a2e] to-[#080c1a]">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Contactez-nous
          </h1>
          <p className="text-[#a0a8b8] max-w-2xl mx-auto text-xl leading-relaxed">
            Une question ? Un projet ? Notre équipe est là pour vous accompagner.
          </p>
        </div>
      </section>

      {/* Contenu principal */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Informations de contact */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-8">Nos coordonnées</h2>

              <div className="space-y-6">
                {/* Adresse */}
                <div className="flex items-start gap-4 p-4 bg-[#0a0f2c] rounded-xl border border-[#1a1a3a]">
                  <div className="w-12 h-12 rounded-lg bg-[#10B981]/20 flex items-center justify-center border border-[#10B981]/30 shrink-0">
                    <MapPinned className="w-6 h-6 text-[#10B981]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-white">Adresse</h3>
                    <p className="text-[#a0a8b8]">43 Rue Maryse Bastié</p>
                    <p className="text-[#a0a8b8]">78300 Poissy, France</p>
                  </div>
                </div>

                {/* Téléphone */}
                <div className="flex items-start gap-4 p-4 bg-[#0a0f2c] rounded-xl border border-[#1a1a3a]">
                  <div className="w-12 h-12 rounded-lg bg-[#10B981]/20 flex items-center justify-center border border-[#10B981]/30 shrink-0">
                    <Phone className="w-6 h-6 text-[#10B981]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-white">Téléphone</h3>
                    <a href="tel:+33745349339" className="text-[#a0a8b8] hover:text-[#10B981] transition-colors">
                      +33 7 45 34 93 39
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4 p-4 bg-[#0a0f2c] rounded-xl border border-[#1a1a3a]">
                  <div className="w-12 h-12 rounded-lg bg-[#10B981]/20 flex items-center justify-center border border-[#10B981]/30 shrink-0">
                    <Mail className="w-6 h-6 text-[#10B981]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-white">Email</h3>
                    <a href="mailto:contact@qrtags.com" className="text-[#a0a8b8] hover:text-[#10B981] transition-colors">
                      contact@qrtags.com
                    </a>
                  </div>
                </div>

                {/* Horaires */}
                <div className="flex items-start gap-4 p-4 bg-[#0a0f2c] rounded-xl border border-[#1a1a3a]">
                  <div className="w-12 h-12 rounded-lg bg-[#10B981]/20 flex items-center justify-center border border-[#10B981]/30 shrink-0">
                    <Clock className="w-6 h-6 text-[#10B981]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-white">Horaires</h3>
                    <p className="text-[#a0a8b8]">Lundi - Vendredi : 9h - 18h</p>
                    <p className="text-[#a0a8b8]">Support 24/7 pour les urgences</p>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex items-start gap-4 p-4 bg-[#0a0f2c] rounded-xl border border-[#1a1a3a]">
                  <div className="w-12 h-12 rounded-lg bg-[#25D366]/20 flex items-center justify-center border border-[#25D366]/30 shrink-0">
                    <MessageCircle className="w-6 h-6 text-[#25D366]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1 text-white">WhatsApp</h3>
                    <a
                      href="https://wa.me/33745349339"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#a0a8b8] hover:text-[#25D366] transition-colors"
                    >
                      +33 7 45 34 93 39
                    </a>
                    <p className="text-[#a0a8b8] text-sm mt-1">Réponse rapide garantie</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulaire de contact */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-8">Envoyez-nous un message</h2>

              <div className="bg-[#0a0f2c] rounded-xl p-6 border border-[#1a1a3a]">
                {submitted ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-20 h-20 text-[#10B981] mx-auto mb-6" />
                    <h3 className="text-2xl font-semibold mb-3 text-white">Message envoyé !</h3>
                    <p className="text-[#a0a8b8] mb-6">
                      Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.
                    </p>
                    <Button
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({ name: '', email: '', subject: '', message: '' });
                      }}
                      className="bg-[#10B981] hover:bg-[#e01e5a] text-white"
                    >
                      Envoyer un autre message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-white">Nom *</label>
                        <input
                          type="text"
                          placeholder="Votre nom"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg bg-[#080c1a] border border-[#1a1a3a] text-white placeholder-[#a0a8b8] focus:outline-none focus:border-[#10B981]"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 text-white">Email *</label>
                        <input
                          type="email"
                          placeholder="votre@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg bg-[#080c1a] border border-[#1a1a3a] text-white placeholder-[#a0a8b8] focus:outline-none focus:border-[#10B981]"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-white">Sujet</label>
                      <input
                        type="text"
                        placeholder="Objet de votre message"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg bg-[#080c1a] border border-[#1a1a3a] text-white placeholder-[#a0a8b8] focus:outline-none focus:border-[#10B981]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-white">Message *</label>
                      <textarea
                        placeholder="Décrivez votre demande..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg bg-[#080c1a] border border-[#1a1a3a] text-white placeholder-[#a0a8b8] focus:outline-none focus:border-[#10B981] min-h-[160px]"
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-[#10B981] hover:bg-[#e01e5a] text-white py-4 font-bold text-lg disabled:opacity-50"
                    >
                      {submitting ? 'Envoi en cours...' : 'Envoyer le message'}
                    </Button>

                    <p className="text-[#a0a8b8] text-sm text-center">
                      Nous répondons généralement sous 24h ouvrées.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map section */}
      <section className="py-16 px-4 bg-[#0a0f2c]">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-6">Nous trouver</h2>
          <p className="text-[#a0a8b8] mb-8">Notre bureau est situé à Poissy, dans les Yvelines (78).</p>
          <a
            href="https://maps.google.com/?q=43+Rue+Maryse+Bastié+78300+Poissy+France"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#10B981] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#e01e5a] transition-colors"
          >
            <MapPinned className="w-5 h-5" />
            Voir sur Google Maps
          </a>
        </div>
      </section>
    </>
  );
}

export default function ContactPage() {
  return (
    <PublicLayout>
      <ContactContent />
    </PublicLayout>
  );
}
