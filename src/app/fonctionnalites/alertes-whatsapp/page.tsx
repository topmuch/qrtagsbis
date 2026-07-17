'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import {
  MessageCircle,
  Bell,
  CheckCircle,
  ArrowRight,
  Shield,
  Smartphone,
  ChevronRight,
  Clock,
  Volume2,
  Phone,
  Zap,
} from 'lucide-react';
import { PublicNavigation, PublicFooter } from '@/components/public/PublicLayout';

function FadeIn({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }} className={className}>
      {children}
    </motion.div>
  );
}

export default function AlertesWhatsAppPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavigation />

      {/* Hero */}
      <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 px-5 bg-gradient-to-b from-green-50/60 via-white to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <FadeIn>
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-green-600 mb-5">
                <MessageCircle className="w-3.5 h-3.5" /> Fonctionnalité
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-[-0.02em] leading-[1.08]">
                Alertes
                <br />
                <span className="bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">WhatsApp</span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                Dès que quelqu&apos;un scanne le QR code de votre objet, vous recevez une alerte WhatsApp instantanée avec la localisation, les coordonnées du trouveur et un lien vers la carte GPS. Pas d&apos;application à installer, pas de notification à configurer.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/devenir-partenaire" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-sm shadow-xl shadow-green-500/20 hover:shadow-green-500/30 transition-all duration-300 hover:scale-105">
                  Commander mes QR codes <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/#comment" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-slate-200 text-slate-700 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all duration-300">
                  Comment ça marche
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-br from-green-200/40 to-emerald-200/40 rounded-[2rem] blur-[50px]" />
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/60 border border-slate-100">
                  <Image
                    src="/images/landing-v2/features/alertes-whatsapp.jpg"
                    alt="Alertes WhatsApp - QRTags"
                    width={600}
                    height={800}
                    className="w-full h-auto object-cover"
                  />
                </div>
                {/* Notification mockup */}
                <motion.div
                  className="absolute -top-4 -left-4 bg-white px-5 py-3 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 flex items-center gap-3"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Objet retrouvé !</p>
                    <p className="text-[10px] text-slate-500">WhatsApp · il y a 2 min</p>
                  </div>
                </motion.div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Pourquoi WhatsApp */}
      <section className="py-20 lg:py-28 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">Pourquoi WhatsApp ?</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">L&apos;outil de messagerie le plus utilisé en Afrique et dans le monde</p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Phone,
                title: '2 milliards d\'utilisateurs',
                description: 'WhatsApp est l\'application de messagerie la plus utilisée au monde, et particulièrement en Afrique où elle est souvent le premier canal de communication. Vos alertes arrivent là où vous êtes déjà.',
              },
              {
                icon: Zap,
                title: 'Notification instantanée',
                description: 'Les messages WhatsApp arrivent en temps réel, avec une notification sonore et vibrante. Vous ne ratez jamais une alerte, même si vous n\'êtes pas attentif à votre téléphone. C\'est plus fiable qu\'un email ou un SMS.',
              },
              {
                icon: Volume2,
                title: 'Riche et interactif',
                description: 'Contrairement à un SMS, un message WhatsApp peut contenir une carte interactive, un lien cliquable vers l\'itinéraire GPS, et les coordonnées du trouveur. Tout ce dont vous avez besoin pour récupérer votre objet rapidement.',
              },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.12}>
                <div className="bg-green-50/40 border border-green-100/60 rounded-2xl p-8 h-full hover:shadow-lg transition-all duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-6">
                    <item.icon className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-[15px] text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Ce que contient l'alerte */}
      <section className="py-20 lg:py-28 px-5 bg-slate-50/60">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">Ce que contient votre alerte</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Toutes les informations essentielles pour récupérer votre objet</p>
          </FadeIn>

          {/* WhatsApp message mockup */}
          <FadeIn>
            <div className="max-w-md mx-auto bg-[#e5ddd5] rounded-2xl p-4 shadow-xl border border-slate-200/60">
              <div className="bg-[#dcf8c6] rounded-xl p-4 shadow-sm max-w-[90%] ml-auto">
                <p className="text-sm font-semibold text-slate-800 mb-2">🔔 Objet retrouvé !</p>
                <p className="text-sm text-slate-700 mb-3">Quelqu&apos;un vient de scanner votre QR code QRTags.</p>
                <div className="bg-white/60 rounded-lg p-3 mb-3">
                  <p className="text-xs font-bold text-slate-700 mb-1">📍 Localisation :</p>
                  <p className="text-xs text-slate-600 mb-2">Aéroport Paris-Charles de Gaulle, Terminal 4</p>
                  <div className="bg-emerald-100 rounded-lg p-2 text-center">
                    <p className="text-[10px] font-bold text-emerald-700">📍 Voir sur la carte →</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mb-1">💬 Message du trouveur :</p>
                <p className="text-xs text-slate-700 italic mb-2">&quot;J&apos;ai trouvé votre valise noire à la sortie du terminal 4. Elle est au point d&apos;information.&quot;</p>
                <p className="text-[10px] text-slate-400 text-right">Aujourd&apos;hui 14:32</p>
              </div>
            </div>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
            {[
              { icon: Bell, title: 'Alerte instantanée', description: 'Notification poussée sur WhatsApp en moins de 5 secondes après le scan.' },
              { icon: Clock, title: 'Horodatage', description: 'L\'heure exacte du scan pour savoir précisément quand votre objet a été trouvé.' },
              { icon: Smartphone, title: 'Carte GPS', description: 'Lien vers une carte interactive avec la position exacte et l\'itinéraire GPS.' },
              { icon: MessageCircle, title: 'Message du trouveur', description: 'Le trouveur peut vous laisser un message pour faciliter la récupération.' },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.08}>
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300 h-full text-center">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-20 lg:py-28 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">Pas de configuration requise</h2>
          </FadeIn>

          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { title: 'Zéro configuration', description: 'Vous n\'avez rien à installer ni à configurer. Dès que vous activez votre QR code, les alertes WhatsApp sont automatiquement activées. C\'est aussi simple que ça.' },
              { title: 'Fonctionne hors ligne', description: 'Même si vous n\'avez pas de connexion Internet au moment du scan, le message est mis en file d\'attente et vous est délivré dès que votre téléphone se reconnecte.' },
              { title: 'Alertes multiples', description: 'Si votre objet est scanné plusieurs fois (par différentes personnes), vous recevez une alerte à chaque scan. Cela vous permet de suivre les déplacements de votre objet en temps réel.' },
              { title: 'Confidentialité préservée', description: 'Votre numéro de téléphone n\'est jamais visible par le trouveur. Les communications transitent par notre plateforme de manière sécurisée et anonymisée.' },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.1}>
                <div className="flex items-start gap-4 p-6 bg-green-50/30 rounded-2xl border border-green-100/60 h-full">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 px-5 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-[-0.02em]">Soyez alerté dès que votre objet est trouvé</h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">Recevez une notification WhatsApp instantanée avec la position GPS de votre objet, sans rien configurer.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/devenir-partenaire" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-green-700 font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                Commander mes QR codes <ChevronRight className="w-4 h-4" />
              </Link>
              <Link href="/voyageurs-standard" className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-all duration-300">
                Voir les tarifs
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
