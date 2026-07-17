'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import {
  QrCode,
  Package,
  CheckCircle,
  ArrowRight,
  ChevronRight,
  Truck,
  Clock,
  Shield,
  CreditCard,
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

export default function RecevezVotreQRPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavigation />

      {/* Hero */}
      <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 px-5 bg-gradient-to-b from-blue-50/60 via-white to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <FadeIn>
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-blue-600 mb-5">
                <QrCode className="w-3.5 h-3.5" /> Étape 1 sur 4
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-[-0.02em] leading-[1.08]">
                Recevez
                <br />
                <span className="bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">votre QR code</span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                Commandez vos QR codes QRTags en quelques clics et recevez vos autocollants directement chez vous ou à votre agence. Chaque QR code est unique, personnalisé et prêt à être activé en 30 secondes.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/devenir-partenaire" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105">
                  Commander mes QR codes <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/hajj-omra" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-slate-200 text-slate-700 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all duration-300">
                  Offre Hajj & Omra
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-br from-blue-200/40 to-indigo-200/40 rounded-[2rem] blur-[50px]" />
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/60 border border-slate-100 aspect-[3/4]">
                  <Image
                    src="/images/landing-v2/step-receive.jpg"
                    alt="Recevez votre QR code - QRTags"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Comment commander */}
      <section className="py-20 lg:py-28 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">Comment recevoir vos QR codes</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Deux façons simples d&apos;obtenir vos autocollants QRTags</p>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-8">
            <FadeIn delay={0.1}>
              <div className="bg-blue-50/40 border border-blue-100/60 rounded-3xl p-9 h-full">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-7">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Commande en ligne</h3>
                <p className="text-[15px] text-slate-500 leading-relaxed mb-6">Passez commande directement sur notre site web. Choisissez votre formule (Solo, Famille ou Hajj & Omra), payez en ligne et recevez vos autocollants sous 3 à 5 jours ouvrés.</p>
                <ul className="space-y-2.5">
                  {['Choisissez votre formule adaptée', 'Paiement sécurisé par carte ou mobile money', 'Livraison à domicile ou en agence', 'Suivi de commande en temps réel'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="bg-violet-50/40 border border-violet-100/60 rounded-3xl p-9 h-full">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mb-7">
                  <Truck className="w-6 h-6 text-violet-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Via votre agence partenaire</h3>
                <p className="text-[15px] text-slate-500 leading-relaxed mb-6">De nombreuses agences de voyage proposent directement les QR codes QRTags lors de la réservation de votre voyage. Demandez à votre agence si elle est partenaire QRTags.</p>
                <ul className="space-y-2.5">
                  {['QR codes inclus dans votre forfait voyage', 'Remis en main propre le jour du départ', 'Activation assistance par l\'agence', 'Plus de 850 agences partenaires'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-violet-500 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Ce que vous recevez */}
      <section className="py-20 lg:py-28 px-5 bg-slate-50/60">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">Ce que vous recevez</h2>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: QrCode, title: 'Autocollants QR', description: 'Des autocollants haute qualité, résistants à l\'eau et aux UV, avec un QR code unique pour chaque objet. Format pratique facile à coller.' },
              { icon: Package, title: 'Mode d\'emploi', description: 'Un guide illustré simple et clair pour activer vos QR codes en 30 secondes. Disponible en français, anglais et arabe.' },
              { icon: Shield, title: 'Activation gratuite', description: 'L\'activation est incluse dans le prix. Pas de frais cachés, pas d\'abonnement supplémentaire. Un scan suffit pour activer.' },
              { icon: Clock, title: 'Validité 1 an', description: 'Chaque QR code est valide pendant 1 an complet à partir de la date d\'activation. Renouvelable facilement en ligne.' },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.08}>
                <div className="bg-white rounded-2xl p-7 border border-slate-200/60 hover:shadow-lg transition-all duration-300 h-full">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5">
                    <item.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Prochaine étape */}
      <section className="py-20 lg:py-28 px-5 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <FadeIn>
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-white/60 mb-4">Étape suivante</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-[-0.02em]">Prêt à activer vos QR codes ?</h2>
            <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">Une fois vos autocollants reçus, l&apos;activation ne prend que 30 secondes. Découvrez comment.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/etapes/activez-30-secondes" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-blue-700 font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                Voir l'étape suivante <ChevronRight className="w-4 h-4" />
              </Link>
              <Link href="/devenir-partenaire" className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-all duration-300">
                Commander mes QR codes
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
