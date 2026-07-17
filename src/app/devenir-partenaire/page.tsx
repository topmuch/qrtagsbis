'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Menu,
  X,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter,
  CheckCircle,
  Send
} from "lucide-react";

// Navigation Component
function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#080c1a]/95 backdrop-blur-md border-b border-[#1a1a3a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="QRTags" className="h-16 w-auto object-contain brightness-0 invert" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {["Solutions", "Comment ça marche", "Tarifs", "Contact"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                className="text-[#a0a8b8] hover:text-[#10B981] transition-colors text-sm"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/demo">
              <button className="text-[#a0a8b8] hover:text-white transition-colors text-sm">
                Démo
              </button>
            </Link>
            <a href="#formulaire">
              <button className="bg-[#10B981] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#e01e5a] transition text-sm">
                Devenir Partenaire
              </button>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-[#e0e6f0]"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-[#1a2238]">
            <div className="flex flex-col gap-4">
              {["Solutions", "Comment ça marche", "Tarifs", "Contact"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                  className="text-[#a0a8b8] hover:text-[#10B981]"
                  onClick={() => setIsOpen(false)}
                >
                  {item}
                </a>
              ))}
              <a href="#formulaire" onClick={() => setIsOpen(false)}>
                <button className="w-full bg-[#10B981] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#e01e5a] transition">
                  Devenir Partenaire
                </button>
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// Hero Section
function HeroSection() {
  return (
    <section className="pt-24 pb-20 px-4 bg-gradient-to-br from-[#080c1a] via-[#0d1220] to-[#1e3a2e]/30 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#059669]/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="px-4 py-2 bg-[#10B981]/20 border border-[#10B981]/50 text-[#10B981] text-sm rounded-full font-medium">
            🤝 Programme Partenaire
          </span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          Devenez partenaire <span className="bg-gradient-to-r from-[#10B981] to-[#059669] bg-clip-text text-transparent">QRTags</span>
        </h1>
        
        <p className="text-[#a0a8b8] max-w-2xl mx-auto mb-8 text-lg">
          Rejoignez plus de 500 établissements de voyage et organisateurs de Hajj qui protègent déjà les objets de leurs clients avec nos QR codes intelligents.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="#formulaire">
            <button className="bg-[#10B981] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#e01e5a] shadow-lg shadow-[#10B981]/30 transition-all hover:scale-105 inline-flex items-center gap-2">
              📩 Demander un devis
            </button>
          </a>
          <a href="#avantages">
            <button className="border-2 border-[#10B981] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#10B981]/10 transition-all inline-flex items-center gap-2">
              📊 Voir les avantages
            </button>
          </a>
        </div>
      </div>
    </section>
  );
}

// Why Partner Section
function WhyPartnerSection() {
  const cards = [
    {
      title: "Revenus supplémentaires",
      desc: "Gagnez jusqu'à 3€ par QR code vendu — sans investissement.",
      icon: "💰"
    },
    {
      title: "Service clé en main",
      desc: "Nous fournissons les QR codes, le dashboard, le support 24/7.",
      icon: "🛠️"
    },
    {
      title: "Confiance renforcée",
      desc: "Vos clients retrouvent leurs objets en moins de 2h — votre réputation s'élève.",
      icon: "⭐"
    }
  ];

  return (
    <section id="avantages" className="py-20 px-4 bg-[#0d1220]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#10B981] to-[#059669] bg-clip-text text-transparent mb-4">
            Pourquoi collaborer avec nous ?
          </h2>
          <p className="text-[#a0a8b8] text-lg">
            Trois raisons de devenir partenaire QRTags
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <div
              key={i}
              className="bg-[#0a0f2c] p-6 rounded-xl border border-[#1a1a3a] hover:border-[#10B981]/50 transition-all hover:scale-105 group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{card.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
              <p className="text-[#a0a8b8]">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Who Can Partner Section
function WhoCanPartnerSection() {
  const partners = [
    { icon: "✈️", label: "Agences de voyages (Hajj, Omra, tourisme)" },
    { icon: "🕋", label: "Tour-opérateurs" },
    { icon: "🤝", label: "Organisateurs de pèlerinage" },
    { icon: "🛫", label: "Compagnies aériennes (B2B)" },
    { icon: "🕌", label: "Associations religieuses" },
  ];

  return (
    <section className="py-20 px-4 bg-[#080c1a]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#10B981] to-[#059669] bg-clip-text text-transparent mb-4">
            Qui peut devenir partenaire ?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {partners.map((partner, i) => (
            <div
              key={i}
              className="flex items-center gap-4 bg-[#0d1220] p-4 rounded-xl border border-[#1a2238] hover:border-[#10B981]/30 transition-all"
            >
              <span className="text-3xl">{partner.icon}</span>
              <span className="text-white font-medium">{partner.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  const testimonials = [
    {
      name: "Amadou Diallo",
      role: "Directeur, Pèlerins du Sénégal",
      text: "QRTags a réduit de 90% les pertes de objets lors du Hajj 2025. Un service révolutionnaire.",
      avatar: "AD"
    },
    {
      name: "Sophie Martin",
      role: "Responsable client, Voyage Senegal",
      text: "Simple, efficace et pas cher. Nos clients adorent la notification WhatsApp instantanée.",
      avatar: "SM"
    }
  ];

  return (
    <section className="py-20 px-4 bg-[#0d1220]">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-[#10B981] to-[#059669] bg-clip-text text-transparent mb-12">
          Ce que disent nos partenaires
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-[#0a0f2c] p-6 rounded-xl border border-[#1a1a3a] hover:border-[#10B981]/30 transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white font-bold">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-bold text-white">{t.name}</div>
                  <div className="text-[#a0a8b8] text-sm">{t.role}</div>
                </div>
              </div>
              <p className="text-[#e0e6f0] italic">&ldquo;{t.text}&rdquo;</p>
              <div className="flex gap-1 mt-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-[#10B981]">★</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Contact Form Section
function ContactFormSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
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
          type: 'partenaire',
          senderName: formData.name,
          senderEmail: formData.email,
          content: {
            agence: formData.company,
            message: formData.message,
          },
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
    <section id="formulaire" className="py-20 px-4 bg-[#080c1a]">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#0a0f2c] rounded-2xl p-8 border border-[#1a1a3a]">
          <h3 className="text-2xl font-bold text-white mb-2">Prêt à booster votre offre ?</h3>
          <p className="text-[#a0a8b8] mb-8">
            Remplissez ce formulaire — nous vous répondrons sous 24h avec un devis personnalisé.
          </p>

          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-[#10B981] mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-white mb-2">Demande envoyée !</h4>
              <p className="text-[#a0a8b8]">Nous vous contacterons sous 24h avec votre devis personnalisé.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Votre nom"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-4 bg-[#0d152a] border border-[#1a1a3a] rounded-xl text-white placeholder-[#a0a8b8] focus:outline-none focus:border-[#10B981] transition-colors"
                required
              />
              <input
                type="email"
                placeholder="Votre email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-4 bg-[#0d152a] border border-[#1a1a3a] rounded-xl text-white placeholder-[#a0a8b8] focus:outline-none focus:border-[#10B981] transition-colors"
                required
              />
              <input
                type="text"
                placeholder="Votre agence / entreprise"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full p-4 bg-[#0d152a] border border-[#1a1a3a] rounded-xl text-white placeholder-[#a0a8b8] focus:outline-none focus:border-[#10B981] transition-colors"
                required
              />
              <textarea
                placeholder="Message (ex: nombre de pèlerins, pays, besoins...)"
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full p-4 bg-[#0d152a] border border-[#1a1a3a] rounded-xl text-white placeholder-[#a0a8b8] focus:outline-none focus:border-[#10B981] transition-colors resize-none"
                required
              />
              <button
                type="submit"
                className="w-full bg-[#10B981] text-white py-4 rounded-xl font-bold hover:bg-[#e01e5a] transition-all hover:scale-[1.02] shadow-lg shadow-[#10B981]/30 inline-flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Envoyer ma demande
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="border-t border-[#1a2238] py-12 px-4 bg-[#080c1a]">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="QRTags" className="h-16 w-auto object-contain brightness-0 invert" />
            </div>
            <p className="text-[#a0a8b8] text-sm">
              Protection intelligente des objets pour voyageurs et pèlerins.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Produit</h4>
            <ul className="space-y-2 text-[#a0a8b8] text-sm">
              <li><a href="/#solutions" className="hover:text-[#10B981] transition-colors">Solutions</a></li>
              <li><a href="/#comment" className="hover:text-[#10B981] transition-colors">Comment ça marche</a></li>
              <li><a href="/#tarifs" className="hover:text-[#10B981] transition-colors">Tarifs</a></li>
              <li><Link href="/demo" className="hover:text-[#10B981] transition-colors">Démo</Link></li>
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Entreprise</h4>
            <ul className="space-y-2 text-[#a0a8b8] text-sm">
              <li><Link href="/contact" className="hover:text-[#10B981] transition-colors">Contact</Link></li>
              <li><Link href="/a-propos" className="hover:text-[#10B981] transition-colors">À propos</Link></li>
              <li><Link href="/devenir-partenaire" className="hover:text-[#10B981] transition-colors">Partenaires</Link></li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Légal</h4>
            <ul className="space-y-2 text-[#a0a8b8] text-sm">
              <li><Link href="/mentions-legales" className="hover:text-[#10B981] transition-colors">Mentions légales</Link></li>
              <li><Link href="/confidentialite" className="hover:text-[#10B981] transition-colors">Politique de confidentialité</Link></li>
              <li><Link href="/cgu" className="hover:text-[#10B981] transition-colors">CGU</Link></li>
            </ul>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8 border-t border-[#1a2238]">
          <div className="flex items-center gap-3 text-[#a0a8b8]">
            <MapPin className="w-5 h-5 text-[#10B981]" />
            <span>Poissy, France</span>
          </div>
          <div className="flex items-center gap-3 text-[#a0a8b8]">
            <Phone className="w-5 h-5 text-[#10B981]" />
            <span>+33 7 45 34 93 39</span>
          </div>
          <div className="flex items-center gap-3 text-[#a0a8b8]">
            <Mail className="w-5 h-5 text-[#10B981]" />
            <span>contact@qrtags.com</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#1a2238] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#a0a8b8] text-sm">
            © {new Date().getFullYear()} QRTags by MMASOLUTION. Tous droits réservés.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            <a href="https://facebook.com/qrtags" target="_blank" rel="noopener noreferrer" className="text-[#a0a8b8] hover:text-[#10B981] transition-colors" aria-label="Facebook">
              <Facebook className="w-5 h-5" aria-hidden="true" />
            </a>
            <a href="https://instagram.com/qrtags" target="_blank" rel="noopener noreferrer" className="text-[#a0a8b8] hover:text-[#10B981] transition-colors" aria-label="Instagram">
              <Instagram className="w-5 h-5" aria-hidden="true" />
            </a>
            <a href="https://twitter.com/qrtags" target="_blank" rel="noopener noreferrer" className="text-[#a0a8b8] hover:text-[#10B981] transition-colors" aria-label="Twitter">
              <Twitter className="w-5 h-5" aria-hidden="true" />
            </a>
          </div>

          {/* Map Link */}
          <a
            href="https://maps.google.com/?q=Poissy+France"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#a0a8b8] hover:text-[#10B981] text-sm flex items-center gap-1 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Nous trouver
          </a>
        </div>
      </div>
    </footer>
  );
}

// Main Page Component
export default function DevenirPartenairePage() {
  return (
    <main className="min-h-screen bg-[#080c1a]">
      <Navigation />
      <HeroSection />
      <WhyPartnerSection />
      <WhoCanPartnerSection />
      <TestimonialsSection />
      <ContactFormSection />
      <Footer />
    </main>
  );
}
