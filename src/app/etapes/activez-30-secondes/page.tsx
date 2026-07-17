'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import {
  Zap,
  Smartphone,
  CheckCircle,
  ArrowRight,
  ChevronRight,
  Clock,
  User,
  Globe,
  QrCode,
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

export default function Activez30SecondesPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavigation />

      {/* Hero */}
      <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 px-5 bg-gradient-to-b from-violet-50/60 via-white to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <FadeIn>
              <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-violet-600 mb-5">
                <Zap className="w-3.5 h-3.5" /> Étape 2 sur 4
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 mb-6 tracking-[-0.02em] leading-[1.08]">
                Activez en
                <br />
                <span className="bg-gradient-to-r from-violet-500 to-violet-700 bg-clip-text text-transparent">30 secondes</span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                L&apos;activation est la étape la plus rapide du processus. Scannez votre QR code, remplissez 3 informations essentielles et c&apos;est fait. Pas d&apos;application à télécharger, pas de compte à créer.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/devenir-partenaire" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm shadow-xl shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300 hover:scale-105">
                  Commander mes QR codes <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/etapes/recevez-votre-qr" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-slate-200 text-slate-700 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all duration-300">
                  Étape précédente
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-br from-violet-200/40 to-purple-200/40 rounded-[2rem] blur-[50px]" />
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/60 border border-slate-100 aspect-[3/4]">
                  <Image
                    src="/images/landing-v2/step-activate.jpg"
                    alt="Activez en 30 secondes - QRTags"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Processus d'activation */}
      <section className="py-20 lg:py-28 px-5 bg-white">
        <div className="max-w-6xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">Comment activer votre QR code</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">3 champs, 30 secondes, et votre objet est protégé</p>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: Smartphone,
                title: 'Scannez le QR code',
                description: 'Ouvrez l\'appareil photo de votre téléphone et scannez le QR code sur l\'autocollant. La page d\'activation s\'ouvre automatiquement dans votre navigateur, sans application à installer.',
                color: 'from-violet-500 to-purple-600',
              },
              {
                step: '2',
                icon: User,
                title: 'Remplissez vos infos',
                description: 'Entrez votre nom, votre numéro WhatsApp et votre destination. C\'est tout. Pas d\'email obligatoire, pas de mot de passe, pas de vérification complexe. Juste l\'essentiel pour vous contacter.',
                color: 'from-purple-500 to-indigo-600',
              },
              {
                step: '3',
                icon: CheckCircle,
                title: 'C\'est activé !',
                description: 'Votre QR code est immédiatement actif. Collez l\'autocollant sur votre objet et voyagez en toute sérénité. Si quelqu\'un scanne votre QR code, vous recevez instantanément une alerte WhatsApp.',
                color: 'from-indigo-500 to-blue-600',
              },
            ].map((item, i) => (
              <FadeIn key={item.step} delay={i * 0.12}>
                <div className="bg-white rounded-3xl p-8 border border-slate-200/60 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500 h-full">
                  <span className={`inline-flex w-11 h-11 bg-gradient-to-br ${item.color} text-white text-sm font-bold rounded-xl items-center justify-center shadow-lg mb-6`}>{item.step}</span>
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-violet-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-[15px] text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ activation */}
      <section className="py-20 lg:py-28 px-5 bg-slate-50/60">
        <div className="max-w-4xl mx-auto">
          <FadeIn className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-[-0.02em]">Questions fréquentes sur l&apos;activation</h2>
          </FadeIn>

          <div className="space-y-4">
            {[
              { q: 'Dois-je télécharger une application ?', r: 'Non, absolument pas. L\'activation se fait directement dans le navigateur de votre téléphone après avoir scanné le QR code. Aucune application à installer, ni sur iPhone ni sur Android.' },
              { q: 'Quelles informations dois-je fournir ?', r: 'Uniquement 3 informations : votre nom (ou pseudonyme), votre numéro WhatsApp pour recevoir les alertes, et votre destination de voyage. C\'est le minimum nécessaire pour vous contacter si votre objet est trouvé.' },
              { q: 'Puis-je modifier mes informations après activation ?', r: 'Oui, vous pouvez mettre à jour vos informations à tout moment en scannant à nouveau votre QR code. Les nouvelles informations remplacent les anciennes instantanément.' },
              { q: 'Combien de temps dure l\'activation ?', r: 'En moyenne 30 secondes. Le scan prend 2 secondes, le remplissage du formulaire environ 25 secondes, et la confirmation est instantanée. C\'est la protection la plus rapide du marché.' },
              { q: 'Mon QR code expire-t-il ?', r: 'Chaque QR code est valide pendant 1 an à partir de la date d\'activation. Vous recevez un rappel WhatsApp avant l\'expiration pour renouveler facilement.' },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <div className="bg-white rounded-2xl p-6 border border-slate-200/60">
                  <h3 className="text-base font-bold text-slate-900 mb-2">{item.q}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.r}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Prochaine étape */}
      <section className="py-20 lg:py-28 px-5 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <FadeIn>
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase text-white/60 mb-4">Étape suivante</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-[-0.02em]">Prêt à voyager serein ?</h2>
            <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">Votre QR code est activé, votre objet est protégé. Découvrez comment profiter de la protection QRTags pendant votre voyage.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/etapes/voyagez-serein" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-violet-700 font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                Voir l'étape suivante <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
