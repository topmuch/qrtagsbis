'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import {
  Lock,
  Shield,
  CheckCircle,
  ArrowRight,
  Eye,
  ChevronRight,
  Globe,
  Server,
  FileCheck,
  UserCheck,
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

export default function SecuriteRGPDPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavigation />

      {/* Hero */}
      <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 px-5 bg-gradient-to-b from-blue-50/60 via-white to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <FadeIn>
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-blue-600 mb-5">
                <Lock className="w-3.5 h-3.5" /> Fonctionnalité
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-[-0.02em] leading-[1.08]">
                Sécurisé
                <br />
                <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">RGPD</span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                Vos données personnelles sont chiffrées, protégées et conformes au Règlement Général sur la Protection des Données. QRTags ne stocke aucune donnée sensible publiquement et chaque information est traitée avec le plus haut niveau de sécurité.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/devenir-partenaire" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105">
                  Commander mes QR codes <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/confidentialite" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-slate-200 text-slate-700 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all duration-300">
                  Politique de confidentialité
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-br from-blue-200/40 to-indigo-200/40 rounded-[2rem] blur-[50px]" />
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/60 border border-slate-100">
                  <Image
                    src="/images/landing-v2/features/securise-rgpd.jpg"
                    alt="Sécurisé RGPD - QRTags"
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Chiffré de bout en bout</p>
                    <p className="text-[10px] text-slate-500">Conforme RGPD</p>
                  </div>
                </motion.div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Principes RGPD */}
      <section className="py-20 lg:py-28 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">Nos engagements RGPD</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Chaque aspect de QRTags est conçu pour respecter votre vie privée</p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Lock, title: 'Chiffrement de bout en bout', description: 'Toutes vos données personnelles sont chiffrées en transit (TLS 1.3) et au repos (AES-256). Personne, pas même nos équipes, ne peut lire vos informations en clair.' },
              { icon: Eye, title: 'Transparence totale', description: 'Vous savez exactement quelles données sont collectées, pourquoi, et comment elles sont utilisées. Notre politique de confidentialité est claire, accessible et sans jargon juridique.' },
              { icon: UserCheck, title: 'Droit à l\'oubli', description: 'Vous pouvez demander la suppression complète de vos données à tout moment. En un clic dans votre espace, ou par email, toutes vos informations sont effacées sous 30 jours.' },
              { icon: Server, title: 'Hébergement européen', description: 'Nos serveurs sont situés en France, au sein de data centers certifiés ISO 27001. Vos données ne quittent jamais l\'Union européenne, conformément aux exigences RGPD.' },
              { icon: FileCheck, title: 'Minimisation des données', description: 'Nous ne collectons que le strict minimum nécessaire au fonctionnement du service. Pas de tracking publicitaire, pas de revente de données, pas de profilage.' },
              { icon: Shield, title: 'Audit de sécurité', description: 'Nos systèmes sont audités régulièrement par des experts en cybersécurité indépendants. Nous appliquons les dernières recommandations de l\'ANSSI et de la CNIL.' },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.08}>
                <div className="bg-blue-50/40 border border-blue-100/60 rounded-2xl p-7 h-full hover:shadow-lg transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-5">
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

      {/* Ce qu'on ne fait jamais */}
      <section className="py-20 lg:py-28 px-5 bg-slate-50/60">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">Ce que nous ne faisons jamais</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Nos engagements clairs et sans ambiguïté</p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {[
              'Nous ne vendons jamais vos données à des tiers',
              'Nous ne faisons jamais de publicité ciblée',
              'Nous ne trackons jamais votre navigation',
              'Nous ne partageons jamais vos informations avec des partenaires commerciaux',
              'Nous ne stockons jamais de données de localisation au-delà du nécessaire',
              'Nous n\'exigeons jamais plus de données que le strict minimum',
              'Nous ne conservons jamais vos données après suppression de votre compte',
              'Nous n\'accédons jamais à vos données sans votre consentement explicite',
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <div className="flex items-start gap-3 bg-white rounded-xl p-5 border border-slate-200/60">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-red-500 text-xs font-bold">✕</span>
                  </div>
                  <p className="text-sm text-slate-700 font-medium leading-relaxed">{item}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Conformité */}
      <section className="py-20 lg:py-28 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">Conformité et certifications</h2>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { title: 'RGPD', description: 'Entièrement conforme au Règlement Général sur la Protection des Données de l\'Union européenne. DPO désigné, registre des traitements tenu à jour.' },
              { title: 'CNIL', description: 'Déclaration de conformité auprès de la Commission Nationale de l\'Informatique et des Libertés. Respect des recommandations en vigueur.' },
              { title: 'ISO 27001', description: 'Nos serveurs sont hébergés dans des data centers certifiés ISO 27001, garantissant le plus haut niveau de sécurité physique et logique.' },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.1}>
                <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-200/60">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-5">
                    <Shield className="w-7 h-7 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 px-5 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-[-0.02em]">Vos données sont entre de bonnes mains</h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">Protégez vos objets avec une solution qui protège aussi votre vie privée.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/devenir-partenaire" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-blue-700 font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                Commander mes QR codes <ChevronRight className="w-4 h-4" />
              </Link>
              <Link href="/confidentialite" className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-all duration-300">
                Politique de confidentialité
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
