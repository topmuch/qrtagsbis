'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import {
  MapPin,
  CheckCircle,
  ArrowRight,
  Shield,
  Smartphone,
  ChevronRight,
  Globe,
  Clock,
  Navigation,
  Wifi,
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

export default function GeolocalisationPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavigation />

      {/* Hero */}
      <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 px-5 bg-gradient-to-b from-emerald-50/60 via-white to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <FadeIn>
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-emerald-600 mb-5">
                <MapPin className="w-3.5 h-3.5" /> Fonctionnalité
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-[-0.02em] leading-[1.08]">
                Géolocalisation
                <br />
                <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">temps réel</span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                Dès que quelqu&apos;un scanne le QR code de votre objet, vous recevez instantanément sa position GPS exacte sur WhatsApp. Vous savez immédiatement où se trouve votre objet, partout dans le monde.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/devenir-partenaire" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-105">
                  Commander mes QR codes <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/#comment" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-slate-200 text-slate-700 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all duration-300">
                  Comment ça marche
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-br from-emerald-200/40 to-teal-200/40 rounded-[2rem] blur-[50px]" />
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/60 border border-slate-100">
                  <Image
                    src="/images/landing-v2/features/geolocalisation.jpg"
                    alt="Géolocalisation - QRTags"
                    width={600}
                    height={800}
                    className="w-full h-auto object-cover"
                  />
                </div>
                <motion.div
                  className="absolute -top-4 -right-4 bg-white px-5 py-3 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 flex items-center gap-3"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Localisé !</p>
                    <p className="text-[10px] text-slate-500">Aéroport CDG · T4</p>
                  </div>
                </motion.div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-20 lg:py-28 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">Comment la géolocalisation fonctionne</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Pas de GPS dans votre objet — c&apos;est le téléphone du trouveur qui fait tout</p>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Smartphone,
                title: 'Scan du QR code',
                description: 'La personne qui trouve votre objet scanne le QR code avec son téléphone. L\'appareil photo ouvre la page QRTags automatiquement, sans application à installer.',
                color: 'from-emerald-500 to-teal-600',
              },
              {
                step: '02',
                icon: Navigation,
                title: 'Position capturée',
                description: 'Lors du scan, le navigateur du trouveur demande l\'autorisation de partager sa position GPS. S\'il accepte, sa localisation exacte (latitude, longitude) est capturée en temps réel.',
                color: 'from-teal-500 to-cyan-600',
              },
              {
                step: '03',
                icon: MapPin,
                title: 'Alerte avec carte',
                description: 'Vous recevez un message WhatsApp avec un lien vers une carte interactive montrant la position exacte de votre objet. Un clic suffit pour lancer l\'itinéraire GPS vers votre objet.',
                color: 'from-cyan-500 to-blue-600',
              },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.12}>
                <div className="bg-white rounded-3xl p-8 border border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 h-full">
                  <span className={`inline-flex w-11 h-11 bg-gradient-to-br ${item.color} text-white text-sm font-bold rounded-xl items-center justify-center shadow-lg mb-6`}>{item.step}</span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-[15px] text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-20 lg:py-28 px-5 bg-slate-50/60">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">Une localisation intelligente</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Pas de GPS dans le objet, pas de batterie à gérer — juste l&apos;intelligence du smartphone du trouveur</p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: Clock, title: 'Notification instantanée', description: 'Dès le scan, vous êtes alerté en moins de 5 secondes. Pas de délai, pas d\'attente. Vous savez immédiatement où se trouve votre objet et pouvez agir tout de suite.' },
              { icon: Globe, title: 'Couverture mondiale', description: 'La géolocalisation QRTags fonctionne dans tous les pays du monde. Partout où un smartphone peut se connecter à Internet, votre objet peut être localisé. Aucune limite géographique.' },
              { icon: Shield, title: 'Respect de la vie privée', description: 'La position n\'est partagée qu\'avec votre consentement explicite. Aucune donnée de localisation n\'est stockée en permanence. Tout est effacé automatiquement après résolution.' },
              { icon: Wifi, title: 'Précision GPS', description: 'La localisation utilise le GPS du smartphone du trouveur, offrant une précision de 3 à 10 mètres en extérieur. Vous recevez les coordonnées exactes, pas une approximation.' },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.1}>
                <div className="bg-white rounded-2xl p-7 border border-slate-200/60 hover:shadow-lg transition-all duration-300 h-full">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-5">
                    <item.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 px-5 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-[-0.02em]">Ne perdez plus jamais vos objets de vue</h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">Soyez notifié instantanément de la position de votre objet, où que vous soyez dans le monde.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/devenir-partenaire" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-emerald-700 font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                Commander mes QR codes <ChevronRight className="w-4 h-4" />
              </Link>
              <Link href="/hajj-omra" className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-all duration-300">
                Voir nos solutions
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
