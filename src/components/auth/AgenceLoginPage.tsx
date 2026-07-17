'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Building2,
  QrCode,
  Plane,
  Luggage,
  Globe,
  Fingerprint,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   DATA
   ══════════════════════════════════════════════════════════ */

const STATS = [
  { value: '10K+', label: 'Objets protégés' },
  { value: '850+', label: 'Agences partenaires' },
  { value: '8+', label: 'Pays couverts' },
  { value: '99.9%', label: 'Disponibilité' },
];

const TESTIMONIALS = [
  {
    name: 'Fatou Diallo',
    role: 'Hôtel Lumière',
    text: 'QRTags a transformé notre gestion de bagages. Zéro perte depuis 2 ans.',
  },
  {
    name: 'Moussa Koné',
    role: 'Transport Sahel',
    text: 'Le dashboard est simple et efficace. Nos clients sont rassurés.',
  },
];

/* ══════════════════════════════════════════════════════════
   FLOATING ICON COMPONENT
   ══════════════════════════════════════════════════════════ */

function FloatingIcon({
  icon: Icon,
  className,
  delay = 0,
  duration = 6,
}: {
  icon: React.ElementType;
  className?: string;
  delay?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{
        opacity: [0.08, 0.18, 0.08],
        scale: [0.85, 1.1, 0.85],
        y: [0, -18, 0],
        rotate: [0, 8, -4, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Icon className="w-full h-full text-yellow-300/40" strokeWidth={1.2} />
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   ANIMATED TESTIMONIAL
   ══════════════════════════════════════════════════════════ */

function AnimatedTestimonial({
  testimonial,
  isActive,
}: {
  testimonial: (typeof TESTIMONIALS)[number];
  isActive: boolean;
}) {
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={testimonial.name}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="space-y-3"
        >
          <p className="text-white/60 text-sm italic leading-relaxed">
            &ldquo;{testimonial.text}&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-700/30">
              <span className="text-white text-xs font-bold">
                {testimonial.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </span>
            </div>
            <div>
              <p className="text-white/85 text-xs font-medium">
                {testimonial.name}
              </p>
              <p className="text-white/35 text-[10px]">{testimonial.role}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════ */

export default function AgenceLoginPage() {
  const router = useRouter();
  const { user, login, loading: authLoading, isAgency, isSuperAdmin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Redirect if already logged in as agency
  useEffect(() => {
    if (authLoading) return;
    if (user && isAgency) {
      router.replace('/agence/tableau-de-bord');
    }
  }, [user, authLoading, isAgency, router]);

  // Rotate testimonials every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'agency' }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        login(data.user);
        router.push('/agence/tableau-de-bord');
      } else {
        setError(data.error || 'Identifiants incorrects');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('agence@qrtags.com');
    setPassword('agence123');
  };

  /* ── Framer Motion Variants ── */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ══════════════════════════════════════════════════
          LEFT PANEL — Emerald Immersive (desktop only)
          ══════════════════════════════════════════════════ */}
      <div className="relative hidden lg:flex lg:w-[52%] min-h-screen flex-col overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#059669] via-[#10B981] to-[#10B981]" />
          {/* Secondary depth gradient */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/80 via-transparent to-[#059669]/60"
          />
        </div>

        {/* Animated gradient orbs */}
        <div className="absolute top-[15%] -left-16 w-[340px] h-[340px] rounded-full bg-yellow-400/15 blur-[100px] animate-pulse" />
        <div
          className="absolute bottom-[20%] right-[-40px] w-[400px] h-[400px] rounded-full bg-yellow-500/10 blur-[120px] animate-pulse"
          style={{ animationDelay: '1.2s' }}
        />
        <div
          className="absolute top-[55%] left-[35%] w-[500px] h-[500px] rounded-full bg-yellow-300/8 blur-[150px] animate-pulse"
          style={{ animationDelay: '2.4s' }}
        />

        {/* Gold accent orb — subtle */}
        <div
          className="absolute bottom-[10%] left-[15%] w-[200px] h-[200px] rounded-full blur-[120px] animate-pulse"
          style={{ backgroundColor: 'rgba(197, 166, 67, 0.08)', animationDelay: '0.6s' }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
          }}
        />

        {/* Floating travel silhouettes */}
        <FloatingIcon icon={Globe} className="top-[18%] right-[12%] w-14 h-14" delay={0} duration={7} />
        <FloatingIcon icon={Plane} className="top-[32%] left-[8%] w-11 h-11" delay={1.5} duration={8} />
        <FloatingIcon icon={Luggage} className="bottom-[28%] right-[18%] w-12 h-12" delay={2.8} duration={6.5} />
        <FloatingIcon icon={QrCode} className="top-[60%] left-[22%] w-10 h-10" delay={0.8} duration={9} />
        <FloatingIcon icon={Plane} className="bottom-[42%] left-[55%] w-8 h-8" delay={3.5} duration={7.5} />
        <FloatingIcon icon={Globe} className="top-[12%] left-[42%] w-7 h-7" delay={4.2} duration={8.5} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          {/* Top: Logo in glass-morphism frame */}
          <div className="flex items-center">
            <Link href="/" className="group">
              <motion.div
                className="w-[76px] h-[76px] rounded-2xl bg-white/[0.1] backdrop-blur-md p-2.5 border border-white/[0.15] flex items-center justify-center group-hover:bg-white/[0.16] transition-all duration-300 shadow-xl shadow-black/10"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <img
                  src="/logo.png"
                  alt="QRTags"
                  className="w-full h-full object-contain drop-shadow-lg"
                />
              </motion.div>
            </Link>
          </div>

          {/* Middle: Hero content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            {/* Floating QR illustration */}
            <motion.div
              className="relative mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-700 flex items-center justify-center shadow-2xl shadow-amber-700/40">
                <QrCode className="w-10 h-10 text-white" />
              </div>
              {/* Decorative dots */}
              <div
                className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-[#F59E0B] animate-bounce"
                style={{ animationDelay: '0.4s' }}
              />
              <div
                className="absolute -bottom-1.5 -right-5 w-3.5 h-3.5 rounded-full bg-yellow-300/70 animate-bounce"
                style={{ animationDelay: '1s' }}
              />
              <div
                className="absolute top-1 -left-3 w-3 h-3 rounded-full bg-white/20 animate-bounce"
                style={{ animationDelay: '1.6s' }}
              />
            </motion.div>

            <motion.h2
              className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-[1.1] tracking-tight"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              Protégez chaque
              <br />
              <span className="bg-gradient-to-r from-[#F59E0B] via-[#F59E0B] to-[#F59E0B] bg-clip-text text-transparent">
                objet, en toute
              </span>
              <br />
              sérénité.
            </motion.h2>

            <motion.p
              className="text-white/50 text-lg leading-relaxed mb-10 max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              Gérez vos tags, vos clients et vos QR codes depuis un seul
              tableau de bord intuitif.
            </motion.p>

            {/* Stats row */}
            <motion.div
              className="grid grid-cols-4 gap-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {STATS.map((stat, i) => (
                <div key={i} className="text-center py-3 rounded-xl bg-white/[0.05] backdrop-blur-sm border border-white/[0.06]">
                  <p className="text-white font-bold text-lg xl:text-xl">
                    {stat.value}
                  </p>
                  <p className="text-white/30 text-[10px] xl:text-xs mt-1 leading-tight px-1">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Bottom: Testimonial with gold accent border */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="border-l-2 pl-5"
              style={{ borderColor: 'rgba(197, 166, 67, 0.5)' }}
            >
              <div className="min-h-[72px]">
                {TESTIMONIALS.map((t, i) => (
                  <AnimatedTestimonial
                    key={t.name}
                    testimonial={t}
                    isActive={i === activeTestimonial}
                  />
                ))}
              </div>
            </div>

            {/* Dots indicator */}
            <div className="flex gap-1.5 mt-4">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  aria-label={`Témoignage ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeTestimonial
                      ? 'bg-[#F59E0B] w-4'
                      : 'bg-white/20 w-1.5 hover:bg-white/35'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          RIGHT PANEL — Clean White Form
          ══════════════════════════════════════════════════ */}
      <div className="w-full lg:w-[48%] min-h-screen flex items-center justify-center bg-white px-6 py-12 sm:px-10 relative">
        {/* Gold gradient accent line at top */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(90deg, #10B981, #F59E0B, #10B981, #F59E0B, #10B981)',
          }}
        />

        <motion.div
          className="w-full max-w-[400px] relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Mobile Logo — compact, centered */}
          <motion.div
            className="lg:hidden flex items-center justify-center mb-8"
            variants={itemVariants}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-700 to-emerald-900 p-2 flex items-center justify-center shadow-lg shadow-emerald-800/20">
              <img
                src="/logo.png"
                alt="QRTags"
                className="w-full h-full object-contain"
              />
            </div>
          </motion.div>

          {/* Badge */}
          <motion.div className="flex items-center gap-2 mb-6" variants={itemVariants}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-700 text-white shadow-sm">
              <Building2 className="w-3 h-3" />
              Agence
            </span>
          </motion.div>

          {/* Header */}
          <motion.div className="mb-8" variants={itemVariants}>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              Bienvenue
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Connectez-vous à votre espace agence pour gérer vos tags et QR
              codes
            </p>
          </motion.div>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-5"
            variants={itemVariants}
          >
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Email
              </label>
              <div
                className={`relative flex items-center rounded-xl border transition-all duration-200 ${
                  focusedField === 'email'
                    ? 'border-yellow-600 bg-white ring-4 ring-yellow-600/[0.08]'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div
                  className={`pl-4 transition-colors duration-200 ${
                    focusedField === 'email' ? 'text-amber-700' : 'text-slate-400'
                  }`}
                >
                  <Mail className="w-[18px] h-[18px]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 py-3.5 px-3 text-sm"
                  placeholder="vous@agence.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Mot de passe
              </label>
              <div
                className={`relative flex items-center rounded-xl border transition-all duration-200 ${
                  focusedField === 'password'
                    ? 'border-yellow-600 bg-white ring-4 ring-yellow-600/[0.08]'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div
                  className={`pl-4 transition-colors duration-200 ${
                    focusedField === 'password'
                      ? 'text-amber-700'
                      : 'text-slate-400'
                  }`}
                >
                  <Lock className="w-[18px] h-[18px]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 py-3.5 px-3 text-sm"
                  placeholder="Entrez votre mot de passe"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pr-4 text-slate-400 hover:text-yellow-600 transition-colors duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? (
                    <EyeOff className="w-[18px] h-[18px]" />
                  ) : (
                    <Eye className="w-[18px] h-[18px]" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer gap-2 group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-700 focus:ring-amber-700/20 cursor-pointer"
                />
                <span className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors">
                  Se souvenir de moi
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-amber-700 hover:text-emerald-800 transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={loading ? {} : { scale: 1.01 }}
              whileTap={loading ? {} : { scale: 0.98 }}
              className="w-full text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-sm bg-gradient-to-r from-yellow-600 to-amber-700 hover:from-yellow-500 hover:to-yellow-600 shadow-lg shadow-yellow-600/25 hover:shadow-xl hover:shadow-yellow-600/30"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Demo Account Card */}
          <motion.div
            className="mt-6 p-4 rounded-xl bg-yellow-50/70 border border-yellow-100"
            variants={itemVariants}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-700 flex items-center justify-center shadow-sm shadow-amber-700/20">
                  <Fingerprint className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-900">
                    Compte démo
                  </p>
                  <p className="text-[10px] text-yellow-600/70 font-mono leading-relaxed">
                    agence@qrtags.com / agence123
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={fillDemo}
                className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-amber-700 text-white hover:bg-yellow-600 active:scale-[0.97] transition-all duration-200 shadow-sm shadow-amber-700/20"
              >
                Remplir
              </button>
            </div>
          </motion.div>

          {/* Switch to Admin */}
          <motion.div
            className="mt-8 text-center text-sm text-slate-500"
            variants={itemVariants}
          >
            Vous êtes administrateur ?{' '}
            <Link
              href="/admin/connexion"
              className="font-semibold text-amber-700 hover:text-emerald-800 transition-colors"
            >
              Connexion SuperAdmin
            </Link>
          </motion.div>

          {/* Bottom links */}
          <motion.div
            className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400"
            variants={itemVariants}
          >
            <Link
              href="/cgu"
              className="hover:text-yellow-600 transition-colors"
            >
              CGU
            </Link>
            <span className="text-slate-200">•</span>
            <Link
              href="/confidentialite"
              className="hover:text-yellow-600 transition-colors"
            >
              Confidentialité
            </Link>
            <span className="text-slate-200">•</span>
            <Link
              href="/contact"
              className="hover:text-yellow-600 transition-colors"
            >
              Aide
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}