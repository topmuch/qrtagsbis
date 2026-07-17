'use client';

import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BRAND, ACCENT, INK } from '@/lib/brand';
import { AGENCY_TYPES } from '@/lib/agency-types';
import {
  Hotel,
  Bus,
  GraduationCap,
  Stethoscope,
  Car,
  Luggage,
  Building2,
  PartyPopper,
  QrCode,
  Shield,
  MapPin,
  Smartphone,
  Search,
  Tag,
  ArrowRight,
  Check,
  Star,
  Phone,
  Mail,
  Globe,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Clock,
  Users,
  Package,
  CheckCircle2,
} from 'lucide-react';

/* ──────────────────────────────────────────────
   Icon Map for Agency Types
   ────────────────────────────────────────────── */
const agencyIconMap: Record<string, React.ElementType> = {
  Hotel,
  Bus,
  GraduationCap,
  Stethoscope,
  Car,
  Luggage,
  Building2,
  PartyPopper,
};

/* ──────────────────────────────────────────────
   Animated Section Wrapper
   ────────────────────────────────────────────── */
function FadeIn({
  children,
  className,
  delay = 0,
  direction = 'up',
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  const directionMap = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directionMap[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   Animated Counter
   ────────────────────────────────────────────── */
function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  if (isInView && count === 0) {
    let start = 0;
    const duration = 2000;
    const stepTime = Math.max(Math.floor(duration / target), 16);
    const increment = Math.ceil(target / (duration / stepTime));
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);
  }

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   SECTION 1: NAVIGATION
   ══════════════════════════════════════════════════════════ */
function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [
    { label: 'Accueil', href: '#hero' },
    { label: 'Fonctionnalités', href: '#features' },
    { label: 'Métiers', href: '#metiers' },
    { label: 'Tarifs', href: '#pricing' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="#hero" className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: BRAND }}
          >
            <Tag className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold" style={{ color: INK }}>
            QR<span style={{ color: BRAND }}>Tags</span>
          </span>
        </a>

        {/* Desktop Links */}
        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Button variant="outline" className="text-sm">
            Connexion
          </Button>
          <Button
            className="text-sm text-white"
            style={{ backgroundColor: BRAND }}
          >
            Essai Gratuit
          </Button>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-gray-100 bg-white/95 backdrop-blur-xl md:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block rounded-lg px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-4 flex flex-col gap-2 pt-4">
                <Button variant="outline" className="w-full">Connexion</Button>
                <Button
                  className="w-full text-white"
                  style={{ backgroundColor: BRAND }}
                >
                  Essai Gratuit
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

/* ══════════════════════════════════════════════════════════
   SECTION 2: HERO
   ══════════════════════════════════════════════════════════ */
function HeroSection() {
  const stats = [
    { value: 10000, suffix: '+', label: 'Objets tracés' },
    { value: 98, suffix: '%', label: 'Taux de restitution' },
    { value: 8, suffix: '', label: 'Métiers supportés' },
    { value: 15, suffix: '+', label: 'Pays' },
  ];

  const floatingCards = [
    { icon: Hotel, label: 'Hôtel', color: '#2563EB', x: '-left-4 top-8', rotate: '-6deg' },
    { icon: Bus, label: 'Bus', color: '#7C3AED', x: '-right-2 top-4', rotate: '4deg' },
    { icon: GraduationCap, label: 'École', color: '#059669', x: '-left-2 bottom-12', rotate: '5deg' },
    { icon: Stethoscope, label: 'Clinique', color: '#DC2626', x: '-right-4 bottom-8', rotate: '-4deg' },
  ];

  return (
    <section id="hero" className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24">
      {/* Background gradient */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${BRAND}, transparent)`,
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <FadeIn>
              <Badge
                className="mb-6 border-0 px-4 py-1.5 text-sm font-medium"
                style={{ backgroundColor: `${BRAND}15`, color: BRAND }}
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Plateforme SaaS pour l&apos;Afrique
              </Badge>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl" style={{ color: INK }}>
                Retrouvez tout objet perdu{' '}
                <span style={{ color: BRAND }}>en un scan</span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="mt-6 text-lg leading-relaxed text-gray-600 sm:text-xl">
                QRTags est la plateforme SaaS qui permet aux entreprises de tracer, identifier et
                restituer les objets perdus grâce à des étiquettes QR code. Adapté aux réalités africaines.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="gap-2 text-white text-base"
                  style={{ backgroundColor: BRAND }}
                >
                  Commencer gratuitement
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="gap-2 text-base">
                  Voir la démo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </FadeIn>

            {/* Stats */}
            <FadeIn delay={0.4}>
              <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center lg:text-left">
                    <div className="text-2xl font-bold sm:text-3xl" style={{ color: BRAND }}>
                      <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                    </div>
                    <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          {/* Hero Visual — QR Code Mockup */}
          <FadeIn delay={0.3} direction="left" className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="relative">
              {/* Main QR Card */}
              <motion.div
                className="relative z-10 mx-auto w-72 rounded-2xl bg-white p-6 shadow-2xl sm:w-80"
                style={{ border: `2px solid ${BRAND}30` }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="mb-4 flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ backgroundColor: BRAND }}
                  >
                    <QrCode className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold" style={{ color: INK }}>QRTags</span>
                </div>
                {/* QR Code Grid Mock */}
                <div className="mx-auto grid w-48 grid-cols-8 gap-[3px] sm:w-56">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-[2px]"
                      style={{
                        backgroundColor:
                          [0,1,2,5,6,7,8,15,16,23,24,31,32,39,40,47,48,55,56,63,7,14,21,28,35,42,49,56,3,4,10,13,17,22,26,29,33,38,42,45,50,53,58,61].includes(i)
                            ? INK
                            : 'transparent',
                      }}
                    />
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm font-semibold" style={{ color: INK }}>TAG-HOTEL-A7F3B2</p>
                  <p className="mt-1 text-xs text-gray-400">Scannez pour signaler</p>
                </div>
              </motion.div>

              {/* Floating Agency Cards */}
              {floatingCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.label}
                    className={`absolute z-20 hidden rounded-xl bg-white px-3 py-2 shadow-lg sm:flex items-center gap-2 ${card.x}`}
                    style={{ transform: `rotate(${card.rotate})` }}
                    animate={{ y: [0, (i % 2 === 0 ? -6 : 6), 0] }}
                    transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
                  >
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${card.color}15`, color: card.color }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: INK }}>
                      {card.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   SECTION 3: TRUSTED BY
   ══════════════════════════════════════════════════════════ */
function TrustedBySection() {
  const businesses = [
    { icon: Hotel, label: 'Hôtels' },
    { icon: Bus, label: 'Bus' },
    { icon: GraduationCap, label: 'Écoles' },
    { icon: Stethoscope, label: 'Cliniques' },
    { icon: Car, label: 'Loueurs' },
    { icon: Building2, label: 'Entreprises' },
    { icon: PartyPopper, label: 'Événements' },
  ];

  return (
    <section className="border-y border-gray-100 bg-gray-50/50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-8 text-center text-sm font-medium uppercase tracking-wider text-gray-400">
          Ils font confiance à QRTags
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 md:gap-16">
          {businesses.map((biz, i) => {
            const Icon = biz.icon;
            return (
              <FadeIn key={biz.label} delay={i * 0.05}>
                <div className="flex items-center gap-2 text-gray-400 transition-colors hover:text-gray-600">
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-semibold">{biz.label}</span>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   SECTION 4: HOW IT WORKS
   ══════════════════════════════════════════════════════════ */
function HowItWorksSection() {
  const steps = [
    {
      icon: QrCode,
      title: 'Créez vos tags',
      description: 'Générez des étiquettes QR code personnalisées pour vos objets',
      step: '01',
    },
    {
      icon: Clock,
      title: 'Activez en 30s',
      description: 'Associez chaque tag à un objet ou une personne via champs dynamiques',
      step: '02',
    },
    {
      icon: Smartphone,
      title: 'Scannez & Signalez',
      description: 'Le trouveur scanne le QR et signale l\'objet trouvé',
      step: '03',
    },
    {
      icon: CheckCircle2,
      title: 'Restituez rapidement',
      description: 'Le propriétaire est notifié instantanément via WhatsApp/SMS',
      step: '04',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center">
            <Badge
              className="mb-4 border-0 px-4 py-1.5 text-sm font-medium"
              style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
            >
              Comment ça marche
            </Badge>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: INK }}>
              4 étapes simples
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              De la création du tag à la restitution, tout est automatisé
            </p>
          </div>
        </FadeIn>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <FadeIn key={step.step} delay={i * 0.1}>
                <div className="group relative">
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className="absolute right-0 top-12 hidden h-[2px] w-full translate-x-1/2 bg-gradient-to-r from-gray-200 to-transparent lg:block" />
                  )}
                  <Card className="relative h-full border-gray-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <CardContent className="p-6">
                      <div
                        className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${BRAND}12` }}
                      >
                        <Icon className="h-6 w-6" style={{ color: BRAND }} />
                      </div>
                      <div
                        className="mb-2 text-xs font-bold uppercase tracking-widest"
                        style={{ color: ACCENT }}
                      >
                        Étape {step.step}
                      </div>
                      <h3 className="mb-2 text-lg font-bold" style={{ color: INK }}>
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-500">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   SECTION 5: MULTI-MÉTIERS
   ══════════════════════════════════════════════════════════ */
function MetiersSection() {
  const metiers = [
    { key: 'hotel' as const, emoji: '🏨', description: 'Gérez les objets oubliés par chambre' },
    { key: 'bus' as const, emoji: '🚌', description: 'Retrouvez les bagages égarés en voyage' },
    { key: 'school' as const, emoji: '🎓', description: 'Identifiez les affaires des élèves' },
    { key: 'clinic' as const, emoji: '🏥', description: 'Sécurisez les effets personnels des patients' },
    { key: 'car_rental' as const, emoji: '🚗', description: 'Tracez clés et accessoires' },
    { key: 'luggage_storage' as const, emoji: '🎒', description: 'Gérez les dépôts et retraits' },
    { key: 'enterprise' as const, emoji: '🏢', description: 'Inventaire du matériel informatique' },
    { key: 'event' as const, emoji: '🎪', description: 'Badges et affaires de participants' },
  ];

  return (
    <section id="metiers" className="bg-gray-50/50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center">
            <Badge
              className="mb-4 border-0 px-4 py-1.5 text-sm font-medium"
              style={{ backgroundColor: `${BRAND}15`, color: BRAND }}
            >
              Multi-métiers
            </Badge>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: INK }}>
              Adapté à chaque métier
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Des champs dynamiques et un flux adapté à votre secteur d&apos;activité
            </p>
          </div>
        </FadeIn>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metiers.map((metier, i) => {
            const typeDef = AGENCY_TYPES[metier.key];
            const Icon = agencyIconMap[typeDef.icon] || Building2;
            return (
              <FadeIn key={metier.key} delay={i * 0.06}>
                <Card
                  className="group h-full border-2 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  style={{ borderColor: `${typeDef.color}30` }}
                >
                  <CardContent className="p-6">
                    <div
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-colors"
                      style={{ backgroundColor: `${typeDef.color}12`, color: typeDef.color }}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-1 text-lg font-bold" style={{ color: INK }}>
                      {metier.emoji} {typeDef.name}
                    </h3>
                    <p className="mb-4 text-sm leading-relaxed text-gray-500">
                      {metier.description}
                    </p>
                    <a
                      href="#"
                      className="inline-flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-80"
                      style={{ color: typeDef.color }}
                    >
                      En savoir plus
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </CardContent>
                </Card>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   SECTION 6: FEATURES
   ══════════════════════════════════════════════════════════ */
function FeaturesSection() {
  const features = [
    {
      icon: Search,
      title: 'Scan sans application',
      description: 'Aucune app à installer, un simple scan suffit',
      emoji: '🔍',
    },
    {
      icon: Smartphone,
      title: 'Notification WhatsApp/SMS',
      description: 'Alerte instantanée au propriétaire',
      emoji: '📱',
    },
    {
      icon: Sparkles,
      title: 'White-label',
      description: 'Personnalisez avec votre logo et couleurs',
      emoji: '🎨',
    },
    {
      icon: Globe,
      title: 'Champs dynamiques',
      description: 'Adaptés à chaque métier',
      emoji: '🌍',
    },
    {
      icon: Shield,
      title: 'Mobile Money',
      description: 'Paiement via Wave, Orange Money, MTN',
      emoji: '💰',
    },
    {
      icon: Package,
      title: 'Dashboard temps réel',
      description: 'Suivez tous vos objets en un coup d\'œil',
      emoji: '📊',
    },
  ];

  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center">
            <Badge
              className="mb-4 border-0 px-4 py-1.5 text-sm font-medium"
              style={{ backgroundColor: `${BRAND}15`, color: BRAND }}
            >
              Fonctionnalités
            </Badge>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: INK }}>
              Tout ce dont vous avez besoin
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Des fonctionnalités pensées pour les réalités africaines
            </p>
          </div>
        </FadeIn>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <FadeIn key={feature.title} delay={i * 0.08}>
                <Card className="group h-full border-gray-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${BRAND}12` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: BRAND }} />
                      </div>
                      <h3 className="text-lg font-bold" style={{ color: INK }}>
                        {feature.emoji} {feature.title}
                      </h3>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-500">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   SECTION 7: PRICING
   ══════════════════════════════════════════════════════════ */
function PricingSection() {
  const plans = [
    {
      name: 'Starter',
      price: '5 000',
      description: 'Pour les petites structures',
      features: ['50 tags', '1 utilisateur', 'Support email', 'QR codes basiques'],
      popular: false,
    },
    {
      name: 'Pro',
      price: '15 000',
      description: 'Pour les entreprises en croissance',
      features: [
        '500 tags',
        '5 utilisateurs',
        'White-label',
        'Notifications WhatsApp',
        'Mobile Money',
        'Support prioritaire',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Sur mesure',
      description: 'Pour les grandes organisations',
      features: [
        'Tags illimités',
        'Utilisateurs illimités',
        'API intégrée',
        'Support dédié',
        'Formation sur site',
        'SLA garanti',
      ],
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="bg-gray-50/50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center">
            <Badge
              className="mb-4 border-0 px-4 py-1.5 text-sm font-medium"
              style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
            >
              Tarifs
            </Badge>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: INK }}>
              Des prix adaptés à l&apos;Afrique
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Payez en FCFA via Mobile Money
            </p>
          </div>
        </FadeIn>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <FadeIn key={plan.name} delay={i * 0.1}>
              <Card
                className={`relative h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  plan.popular
                    ? 'border-2 shadow-lg'
                    : 'border-gray-100 bg-white'
                }`}
                style={plan.popular ? { borderColor: BRAND } : {}}
              >
                {plan.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: ACCENT }}
                  >
                    Populaire
                  </div>
                )}
                <CardContent className="p-6 sm:p-8">
                  <h3 className="text-lg font-bold" style={{ color: INK }}>
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                  <div className="mt-6">
                    {plan.price === 'Sur mesure' ? (
                      <span className="text-3xl font-extrabold" style={{ color: INK }}>
                        Sur mesure
                      </span>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold" style={{ color: INK }}>
                          {plan.price}
                        </span>
                        <span className="text-sm text-gray-500">FCFA/mois</span>
                      </div>
                    )}
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="h-4 w-4 flex-shrink-0" style={{ color: BRAND }} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`mt-8 w-full gap-2 ${
                      plan.popular ? 'text-white' : ''
                    }`}
                    style={{
                      backgroundColor: plan.popular ? BRAND : 'transparent',
                      borderColor: BRAND,
                      color: plan.popular ? 'white' : BRAND,
                    }}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.price === 'Sur mesure' ? 'Nous contacter' : 'Commencer'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   SECTION 8: TESTIMONIALS
   ══════════════════════════════════════════════════════════ */
function TestimonialsSection() {
  const testimonials = [
    {
      quote: 'Grâce à QRTags, nous retrouvons 95% des objets oubliés dans notre hôtel',
      author: 'Amadou D.',
      role: 'Directeur Hôtel Teranga',
      rating: 5,
    },
    {
      quote: 'Nos élèves perdent moins d\'affaires depuis qu\'on utilise les tags',
      author: 'Fatou S.',
      role: 'Directrice École Dakar',
      rating: 5,
    },
    {
      quote: 'Le paiement par Wave nous a simplifié la vie',
      author: 'Moussa B.',
      role: 'Gérant Bus Express',
      rating: 5,
    },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center">
            <Badge
              className="mb-4 border-0 px-4 py-1.5 text-sm font-medium"
              style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
            >
              Témoignages
            </Badge>
            <h2 className="text-3xl font-bold sm:text-4xl" style={{ color: INK }}>
              Ils nous font confiance
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Découvrez les retours de nos utilisateurs
            </p>
          </div>
        </FadeIn>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <FadeIn key={testimonial.author} delay={i * 0.1}>
              <Card className="h-full border-gray-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="p-6">
                  {/* Stars */}
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, j) => (
                      <Star
                        key={j}
                        className="h-4 w-4 fill-current"
                        style={{ color: ACCENT }}
                      />
                    ))}
                  </div>
                  <p className="mb-6 text-base leading-relaxed text-gray-700 italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: BRAND }}
                    >
                      {testimonial.author.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: INK }}>
                        {testimonial.author}
                      </p>
                      <p className="text-xs text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   SECTION 9: FINAL CTA
   ══════════════════════════════════════════════════════════ */
function FinalCTA() {
  return (
    <section id="contact" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div
            className="relative overflow-hidden rounded-3xl px-6 py-16 text-center sm:px-16 sm:py-20"
            style={{ backgroundColor: BRAND }}
          >
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-12 -right-12 h-40 w-40 rounded-full bg-white/10" />

            <h2 className="relative text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              Prêt à ne plus jamais perdre un objet ?
            </h2>
            <p className="relative mx-auto mt-4 max-w-2xl text-lg text-white/80">
              Rejoignez les entreprises qui font confiance à QRTags pour la gestion de leurs objets perdus
            </p>
            <div className="relative mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                className="gap-2 bg-white text-base font-bold"
                style={{ color: BRAND }}
              >
                Essai gratuit de 14 jours
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-white/30 text-base text-white hover:bg-white/10"
              >
                <Phone className="h-4 w-4" />
                Nous appeler
              </Button>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   SECTION 10: FOOTER
   ══════════════════════════════════════════════════════════ */
function Footer() {
  const columns = [
    {
      title: 'Produit',
      links: ['Fonctionnalités', 'Tarifs', 'Intégrations', 'API', 'Mises à jour'],
    },
    {
      title: 'Entreprise',
      links: ['À propos', 'Blog', 'Carrières', 'Presse', 'Partenaires'],
    },
    {
      title: 'Support',
      links: ['Centre d\'aide', 'Documentation', 'Statut', 'Communauté', 'Contact'],
    },
    {
      title: 'Légal',
      links: ['Confidentialité', 'CGU', 'Cookies', 'Mentions légales', 'RGPD'],
    },
  ];

  return (
    <footer className="border-t border-gray-100 bg-gray-900 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: BRAND }}
              >
                <Tag className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                QR<span style={{ color: BRAND }}>Tags</span>
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              Plateforme de gestion d&apos;objets perdus via QR codes. Adaptée aux réalités africaines.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                aria-label="Facebook"
              >
                <Globe className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
                aria-label="Phone"
              >
                <Phone className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-300">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-gray-800 pt-8 text-center">
          <p className="text-sm text-gray-500">
            © 2024 QRTags. Plateforme de gestion d&apos;objets perdus via QR codes.
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navigation />
      <main className="flex-1">
        <HeroSection />
        <TrustedBySection />
        <HowItWorksSection />
        <MetiersSection />
        <FeaturesSection />
        <PricingSection />
        <TestimonialsSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
