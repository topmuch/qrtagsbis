'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import {
  Smartphone,
  QrCode,
  CheckCircle,
  ArrowRight,
  Shield,
  Zap,
  ChevronRight,
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

export default function SansApplicationPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavigation />

      {/* Hero */}
      <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 px-5 bg-gradient-to-b from-violet-50/60 via-white to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <FadeIn>
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-violet-600 mb-5">
                <Smartphone className="w-3.5 h-3.5" /> Fonctionnalité
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-[-0.02em] leading-[1.08]">
                Sans application,
                <br />
                <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">un scan suffit</span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                QRTags ne vous demande jamais de télécharger une application. Collez l&apos;autocollant QR code sur votre objet, et toute personne qui le trouve peut vous contacter en un simple scan. Zéro friction, zéro barrière.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/devenir-partenaire" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm shadow-xl shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300 hover:scale-105">
                  Commander mes QR codes <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/#comment" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-slate-200 text-slate-700 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all duration-300">
                  Comment ça marche
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-br from-violet-200/40 to-purple-200/40 rounded-[2rem] blur-[50px]" />
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/60 border border-slate-100">
                  <Image
                    src="/images/landing-v2/features/sans-app.jpg"
                    alt="Sans application - QRTags"
                    width={600}
                    height={800}
                    className="w-full h-auto object-cover"
                  />
                </div>
                <motion.div
                  className="absolute -bottom-4 -left-4 bg-white px-5 py-3 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 flex items-center gap-3"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Scan instantané</p>
                    <p className="text-[10px] text-slate-500">Pas d&apos;app requise</p>
                  </div>
                </motion.div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Problème vs Solution */}
      <section className="py-20 lg:py-28 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">Le problème des applications</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Pourquoi imposer un téléchargement quand un scan suffit ?</p>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-8">
            <FadeIn delay={0.1}>
              <div className="bg-red-50/60 border border-red-100 rounded-3xl p-8 h-full">
                <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mb-6">
                  <span className="text-red-600 text-xl font-bold">✕</span>
                </div>
                <h3 className="text-xl font-bold text-red-900 mb-4">Avec une application classique</h3>
                <ul className="space-y-3">
                  {[
                    'Obligation de télécharger une app depuis le store',
                    'Création de compte obligatoire avec email et mot de passe',
                    'Mises à jour régulières qui consomment de la batterie et du stockage',
                    'Incompatibilité avec certains modèles de téléphone',
                    'Friction importante pour la personne qui trouve le objet',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-red-800/80 leading-relaxed">
                      <span className="mt-0.5 w-5 h-5 rounded-full bg-red-200/60 flex items-center justify-center shrink-0 text-[10px] font-bold text-red-600">{i + 1}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-3xl p-8 h-full">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-emerald-900 mb-4">Avec QRTags, sans application</h3>
                <ul className="space-y-3">
                  {[
                    'Zéro téléchargement — le scan ouvre directement la page web',
                    'Zéro inscription — la personne qui trouve le objet agit immédiatement',
                    'Fonctionne sur tout appareil avec un appareil photo : iPhone, Android, tablette',
                    'Pas de stockage ni de batterie consommés sur votre téléphone',
                    'Expérience fluide et instantanée pour le trouveur comme pour le propriétaire',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-emerald-800/80 leading-relaxed">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-20 lg:py-28 px-5 bg-slate-50/60">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">Comment ça marche sans app</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">3 étapes, 0 application</p>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Collez le QR code',
                description: 'Recevez vos autocollants QRTags et collez-les bien visiblement sur chacun de vos objets. Chaque QR code est unique et lié à votre profil voyageur.',
                color: 'from-violet-500 to-purple-600',
              },
              {
                step: '02',
                title: 'Quelqu\'un scanne',
                description: 'Si votre objet est égaré, la personne qui le trouve scanne simplement le QR code avec l\'appareil photo de son téléphone. Aucune application à installer — ça ouvre une page web instantanément.',
                color: 'from-purple-500 to-indigo-600',
              },
              {
                step: '03',
                title: 'Vous êtes notifié',
                description: 'Dès que le QR code est scanné, vous recevez une alerte WhatsApp avec la localisation exacte et les coordonnées du trouveur. Vous n\'avez rien fait d\'autre que coller un autocollant.',
                color: 'from-indigo-500 to-blue-600',
              },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.12}>
                <div className="bg-white rounded-3xl p-8 border border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 h-full">
                  <span className={`inline-flex w-11 h-11 bg-gradient-to-br ${item.color} text-white text-sm font-bold rounded-xl items-center justify-center shadow-lg mb-6`}>{item.step}</span>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-[15px] text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Avantages clés */}
      <section className="py-20 lg:py-28 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">Les avantages de l&apos;approche sans app</h2>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: 'Instantané', description: 'Le scan ouvre la page en moins de 2 secondes. Pas de temps de chargement d\'application ou de création de compte.' },
              { icon: Smartphone, title: 'Universel', description: 'Fonctionne sur tous les smartphones du monde : iPhone, Samsung, Huawei, Xiaomi, etc. Aucune compatibilité à vérifier.' },
              { icon: Shield, title: 'Private', description: 'Aucune donnée personnelle n\'est stockée dans une application. Vos informations restent sécurisées sur nos serveurs certifiés RGPD.' },
              { icon: QrCode, title: 'Simple', description: 'L\'expérience la plus simple possible : un scan = une action. Pas de formulaire, pas d\'inscription, pas de friction.' },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.1}>
                <div className="bg-violet-50/50 border border-violet-100/60 rounded-2xl p-7 h-full hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-5">
                    <item.icon className="w-5 h-5 text-violet-600" />
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
      <section className="py-20 lg:py-28 px-5 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-[-0.02em]">Prêt à protéger vos objets sans application ?</h2>
            <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">Rejoignez les milliers de voyageurs qui font confiance à QRTags pour la protection de leurs objets, sans jamais télécharger une application.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/devenir-partenaire" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-violet-700 font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
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
