'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import {
  Plane,
  Luggage,
  CheckCircle,
  ArrowRight,
  ChevronRight,
  Shield,
  MapPin,
  QrCode,
  Eye,
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

export default function VoyagezSereinPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavigation />

      {/* Hero */}
      <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 px-5 bg-gradient-to-b from-emerald-50/60 via-white to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <FadeIn>
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-emerald-600 mb-5">
                <Plane className="w-3.5 h-3.5" /> Étape 3 sur 4
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-[-0.02em] leading-[1.08]">
                Voyagez
                <br />
                <span className="bg-gradient-to-r from-emerald-500 to-emerald-700 bg-clip-text text-transparent">serein</span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                Votre QR code est activé, votre objet est protégé. Collez simplement l&apos;autocollant bien visible sur chaque valise et profitez de votre voyage en toute tranquillité. Si votre objet est égaré, QRTags s&apos;occupe de tout.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/devenir-partenaire" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-105">
                  Commander mes QR codes <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/etapes/activez-30-secondes" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-slate-200 text-slate-700 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all duration-300">
                  Étape précédente
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-br from-emerald-200/40 to-teal-200/40 rounded-[2rem] blur-[50px]" />
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/60 border border-slate-100 aspect-[3/4]">
                  <Image
                    src="/images/landing-v2/step-travel.jpg"
                    alt="Voyagez serein - QRTags"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Conseils de placement */}
      <section className="py-20 lg:py-28 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">Où coller votre QR code</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Un bon placement maximise les chances de récupération</p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Face supérieure de la valise', description: 'La position idéale. Quand votre valise est sur le tapis roulant, le QR code est immédiatement visible par n\'importe qui la manipule.', recommended: true },
              { title: 'Côté plat de la valise', description: 'Si la face supérieure n\'est pas disponible, collez-le sur le côté le plus plat et le plus visible. Évitez les zones près des roulettes ou de la poignée.' },
              { title: 'Sac cabine ou sac à main', description: 'Pour les sacs qui ne sont pas en soute, collez le QR code sur une surface rigide si possible, ou utilisez le porte-clé QRTags fourni avec certaines formules.' },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.1}>
                <div className={`rounded-2xl p-7 h-full ${item.recommended ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-white border border-slate-200/60'}`}>
                  {item.recommended && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold mb-4">
                      <CheckCircle className="w-3 h-3" /> Recommandé
                    </span>
                  )}
                  <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Ce qui se passe si... */}
      <section className="py-20 lg:py-28 px-5 bg-slate-50/60">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">Que se passe-t-il si votre objet est perdu ?</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Vous n&apos;avez rien à faire — QRTags s&apos;occupe de tout automatiquement</p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Eye, title: 'Quelqu\'un trouve votre objet', description: 'Un agent de l\'aéroport, un passager ou un membre du personnel trouve votre valise et remarque l\'autocollant QRTags.' },
              { icon: QrCode, title: 'Il scanne le QR code', description: 'La personne utilise l\'appareil photo de son téléphone pour scanner le QR code. La page de signalement s\'ouvre instantanément, sans application.' },
              { icon: MapPin, title: 'Vous recevez la localisation', description: 'Dès le scan, vous recevez une alerte WhatsApp avec la position GPS exacte de votre objet et les coordonnées du trouveur.' },
              { icon: Shield, title: 'Vous récupérez votre objet', description: 'Avec la localisation et les informations du trouveur, vous pouvez organiser la récupération rapidement, où que vous soyez dans le monde.' },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.08}>
                <div className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-slate-200/60 h-full">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-emerald-600" />
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

      {/* Prochaine étape */}
      <section className="py-20 lg:py-28 px-5 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <FadeIn>
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-white/60 mb-4">Étape suivante</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-[-0.02em]">Découvrez comment vous êtes notifié</h2>
            <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">L&apos;alerte WhatsApp instantanée est le coeur de la protection QRTags. Découvrez comment ça fonctionne.</p>
            <Link href="/etapes/soyez-notifie" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-emerald-700 font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              Voir l'étape suivante <ChevronRight className="w-4 h-4" />
            </Link>
          </FadeIn>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
