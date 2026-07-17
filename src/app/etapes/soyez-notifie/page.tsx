'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import {
  Bell,
  MessageCircle,
  CheckCircle,
  ArrowRight,
  ChevronRight,
  MapPin,
  Smartphone,
  Clock,
  Volume2,
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

export default function SoyezNotifiePage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavigation />

      {/* Hero */}
      <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 px-5 bg-gradient-to-b from-orange-50/60 via-white to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <FadeIn>
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-orange-600 mb-5">
                <Bell className="w-3.5 h-3.5" /> Étape 4 sur 4
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-[-0.02em] leading-[1.08]">
                Soyez notifié
                <br />
                <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">instantanément</span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                C&apos;est le moment où la magie opère. Dès que quelqu&apos;un scanne le QR code de votre objet égaré, vous recevez une alerte WhatsApp en moins de 5 secondes avec la localisation exacte et les coordonnées du trouveur.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/devenir-partenaire" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-xl shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-300 hover:scale-105">
                  Commander mes QR codes <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/etapes/voyagez-serein" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-slate-200 text-slate-700 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all duration-300">
                  Étape précédente
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-br from-orange-200/40 to-amber-200/40 rounded-[2rem] blur-[50px]" />
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/60 border border-slate-100 aspect-[3/4]">
                  <Image
                    src="/images/landing-v2/step-notify.jpg"
                    alt="Soyez notifié instantanément - QRTags"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Notification mockup */}
      <section className="py-20 lg:py-28 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">Voici ce que vous recevez</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Une alerte complète avec tout ce dont vous avez besoin</p>
          </FadeIn>

          <FadeIn>
            <div className="max-w-md mx-auto">
              <div className="bg-[#e5ddd5] rounded-2xl p-4 shadow-xl border border-slate-200/60">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3 px-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">QRTags Alertes</p>
                    <p className="text-[10px] text-slate-500">en ligne</p>
                  </div>
                </div>
                {/* Message */}
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
                  <p className="text-xs text-slate-700 italic mb-2">&quot;J&apos;ai trouvé votre valise à la sortie du terminal. Elle est au point d&apos;information.&quot;</p>
                  <p className="text-[10px] text-slate-400 text-right">Aujourd&apos;hui 14:32</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Détails de l'alerte */}
      <section className="py-20 lg:py-28 px-5 bg-slate-50/60">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">Chaque détail compte</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Votre alerte contient toutes les informations pour récupérer votre objet rapidement</p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Clock, title: 'Horodatage précis', description: 'L\'heure exacte du scan pour savoir quand votre objet a été trouvé, essentiel pour les réclamations auprès de la compagnie aérienne.' },
              { icon: MapPin, title: 'Position GPS exacte', description: 'Les coordonnées GPS précises du lieu du scan, avec un lien cliquable vers Google Maps pour lancer l\'itinéraire en un tap.' },
              { icon: MessageCircle, title: 'Message du trouveur', description: 'Le trouveur peut vous laisser un message personnalisé pour vous indiquer exactement où se trouve votre objet et comment le récupérer.' },
              { icon: Volume2, title: 'Notification sonore', description: 'L\'alerte WhatsApp déclenche une notification sonore et vibrante sur votre téléphone, même en mode ne pas déranger.' },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.08}>
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60 hover:shadow-lg transition-all duration-300 h-full text-center">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Statistiques */}
      <section className="py-20 lg:py-28 px-5 bg-white">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">Des résultats concrets</h2>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { value: '< 5s', label: 'Temps de notification', description: 'Entre le scan du QR code et la réception de l\'alerte WhatsApp sur votre téléphone.' },
              { value: '98%', label: 'Taux de récupération', description: 'Des objets protégés par QRTags sont récupérés par leur propriétaire.' },
              { value: '2h', label: 'Temps moyen', description: 'Temps moyen entre l\'alerte et la récupération effective du objet.' },
            ].map((item, i) => (
              <FadeIn key={item.label} delay={i * 0.1}>
                <div className="text-center">
                  <p className="text-5xl font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent mb-2">{item.value}</p>
                  <p className="text-base font-bold text-slate-900 mb-2">{item.label}</p>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 lg:py-28 px-5 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <FadeIn>
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-white/60 mb-4">Vous êtes prêt !</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-[-0.02em]">Commencez à protéger vos objets</h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">4 étapes, 30 secondes d&apos;activation, une protection illimitée. Rejoignez les milliers de voyageurs qui font confiance à QRTags.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/devenir-partenaire" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-orange-700 font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                Commander mes QR codes <ChevronRight className="w-4 h-4" />
              </Link>
              <Link href="/hajj-omra" className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-all duration-300">
                Offre Hajj & Omra
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
