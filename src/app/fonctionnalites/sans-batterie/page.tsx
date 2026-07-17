'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import {
  Zap,
  Battery,
  CheckCircle,
  ArrowRight,
  Shield,
  Smartphone,
  ChevronRight,
  Globe,
  Clock,
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

export default function SansBatteriePage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavigation />

      {/* Hero */}
      <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 px-5 bg-gradient-to-b from-amber-50/60 via-white to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <FadeIn>
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-amber-600 mb-5">
                <Battery className="w-3.5 h-3.5" /> Fonctionnalité
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-[-0.02em] leading-[1.08]">
                Sans batterie,
                <br />
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">autonome à 100%</span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                Contrairement aux trackers GPS ou Bluetooth, les QR codes QRTags ne nécessitent aucune source d&apos;énergie. Pas de batterie à charger, pas de pile à remplacer, pas de technologie à entretenir. Votre protection fonctionne toujours, même après des semaines ou des mois de voyage.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/devenir-partenaire" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-300 hover:scale-105">
                  Commander mes QR codes <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/#comment" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-slate-200 text-slate-700 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all duration-300">
                  Comment ça marche
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-br from-amber-200/40 to-orange-200/40 rounded-[2rem] blur-[50px]" />
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/60 border border-slate-100">
                  <Image
                    src="/images/landing-v2/features/sans-batterie.jpg"
                    alt="Sans batterie - QRTags"
                    width={600}
                    height={800}
                    className="w-full h-auto object-cover"
                  />
                </div>
                <motion.div
                  className="absolute -bottom-4 -right-4 bg-white px-5 py-3 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 flex items-center gap-3"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">0% batterie</p>
                    <p className="text-[10px] text-slate-500">100% efficace</p>
                  </div>
                </motion.div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Comparaison technologies */}
      <section className="py-20 lg:py-28 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">Pourquoi le QR code bat le tracker</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Les trackers GPS et AirTags ont des limites que QRTags n&apos;a pas</p>
          </FadeIn>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left py-4 px-6 text-sm font-bold text-slate-600 rounded-tl-2xl">Critère</th>
                  <th className="text-center py-4 px-6 text-sm font-bold text-amber-600">QRTags (QR Code)</th>
                  <th className="text-center py-4 px-6 text-sm font-bold text-slate-400 rounded-tr-2xl">Tracker GPS / AirTag</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { criterion: 'Batterie requise', qrtags: 'Aucune', tracker: 'Pile à remplacer tous les 6-12 mois' },
                  { criterion: 'Coût initial', qrtags: '5€/an', tracker: '30-150€ + abonnement' },
                  { criterion: 'Autonomie', qrtags: 'Illimitée', tracker: 'Limitée par la durée de la batterie' },
                  { criterion: 'Poids', qrtags: '< 1 gramme', tracker: '20-50 grammes' },
                  { criterion: 'Risque de panne', qrtags: 'Aucun', tracker: 'Batterie morte = protection morte' },
                  { criterion: 'Compatibilité', qrtags: 'Tous les téléphones', tracker: 'Écosystème limité (Apple, Samsung...)' },
                  { criterion: 'Visibilité', qrtags: 'Visible et identifiable', tracker: 'Caché, difficile à trouver' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-700">{row.criterion}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5 text-amber-500" /> {row.qrtags}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center text-slate-400">{row.tracker}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-20 lg:py-28 px-5 bg-slate-50/60">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">La protection qui ne s&apos;éteint jamais</h2>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Clock, title: 'Toujours opérationnel', description: 'Un QR code ne s\'éteint jamais. Pas de batterie à surveiller, pas de charge à planifier. Votre objet est protégé 24h/24, 365 jours par an, sans interruption.' },
              { icon: Globe, title: 'Fonctionne partout', description: 'Pas de réseau cellulaire ? Pas de problème. Un QR code peut être scanné même hors ligne par l\'appareil photo du téléphone. Aucune dépendance à un réseau ou à un satellite.' },
              { icon: Shield, title: 'Zéro maintenance', description: 'Contrairement aux trackers qui nécessitent des mises à jour, des remplacements de pile et des vérifications régulières, un QR code QRTags ne demande absolument rien une fois collé.' },
              { icon: Zap, title: 'Léger et discret', description: 'Moins d\'un gramme, fin comme un autocollant. Le QR code QRTags se fait oublier dans votre objet tout en restant la protection la plus efficace du marché.' },
              { icon: Smartphone, title: 'Universel', description: 'Pas de compatibilité à vérifier. Un QR code fonctionne avec n\'importe quel smartphone, quelle que soit la marque, le modèle ou le système d\'exploitation.' },
              { icon: Battery, title: 'Écologique', description: 'Pas de batterie = pas de déchets électroniques. Le QR code est la solution la plus écologique pour la protection de objets. Simple, efficace, responsable.' },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.08}>
                <div className="bg-white rounded-2xl p-7 border border-slate-200/60 hover:shadow-lg transition-all duration-300 h-full">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-5">
                    <item.icon className="w-5 h-5 text-amber-600" />
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
      <section className="py-20 lg:py-28 px-5 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-[-0.02em]">Protégez vos objets sans jamais recharger</h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">La protection la plus fiable est celle qui ne dépend d&apos;aucune batterie. Découvrez QRTags et voyagez en toute sérénité.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/devenir-partenaire" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-amber-700 font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
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
