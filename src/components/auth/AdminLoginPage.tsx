'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Shield,
  QrCode,
  Fingerprint,
  KeyRound,
  Activity,
  Server,
  type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ══════════════════════════════════════════════════════════════
   DATA
   ══════════════════════════════════════════════════════════════ */

const STATS = [
  { value: '2M+', label: 'Objets protégés', icon: QrCode },
  { value: '850+', label: 'Agences partenaires', icon: Server },
  { value: '45+', label: 'Pays couverts', icon: Activity },
  { value: '99.9%', label: 'Disponibilité', icon: Shield },
] as const;

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
] as const;

/* ══════════════════════════════════════════════════════════════
   HEXAGONAL GRID — SVG ANIMATED BACKGROUND
   ══════════════════════════════════════════════════════════════ */

function HexagonalGrid() {
  const hexSize = 50;
  const hexWidth = hexSize * 2;
  const hexHeight = Math.sqrt(3) * hexSize;
  const cols = 6;
  const rows = 5;

  const hexPoints = (cx: number, cy: number): string => {
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30);
      pts.push(`${cx + hexSize * Math.cos(angle)},${cy + hexSize * Math.sin(angle)}`);
    }
    return pts.join(' ');
  };

  const hexagons: { cx: number; cy: number; key: number }[] = [];
  let keyIdx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const offsetX = row % 2 !== 0 ? hexWidth * 0.75 : 0;
      const cx = col * hexWidth * 0.75 + offsetX;
      const cy = row * hexHeight;
      hexagons.push({ cx, cy, key: keyIdx++ });
    }
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox={`0 0 ${cols * hexWidth * 0.75 + hexWidth} ${rows * hexHeight}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="hex-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {hexagons.map((hex) => (
        <polygon
          key={hex.key}
          points={hexPoints(hex.cx, hex.cy)}
          fill="none"
          stroke="url(#hex-stroke)"
          strokeWidth="0.8"
          opacity={0.2 + (hex.key % 3) * 0.1}
        />
      ))}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   DATA FLOW LINES — animated SVG lines
   ══════════════════════════════════════════════════════════════ */

function DataFlowLines() {
  const lines = [
    { x1: '10%', y1: '15%', x2: '60%', y2: '25%', dur: '4s' },
    { x1: '20%', y1: '40%', x2: '80%', y2: '35%', dur: '5s' },
    { x1: '5%', y1: '70%', x2: '70%', y2: '60%', dur: '3.5s' },
    { x1: '30%', y1: '85%', x2: '90%', y2: '75%', dur: '4.5s' },
    { x1: '15%', y1: '55%', x2: '50%', y2: '50%', dur: '3s' },
  ];

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
      <defs>
        <linearGradient id="flow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0" />
          <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
        </linearGradient>
      </defs>
      {lines.map((line, i) => (
        <line
          key={i}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="url(#flow-grad)"
          strokeWidth="1"
          strokeDasharray="8 12"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;-40"
            dur={line.dur}
            repeatCount="indefinite"
          />
        </line>
      ))}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════
   PULSING CIRCLES — concentric radar rings
   ══════════════════════════════════════════════════════════════ */

function PulsingCircles() {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
      {[80, 140, 210, 290].map((size, i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-500/20 animate-pulse"
          style={{
            width: size,
            height: size,
            animationDuration: `${3 + i * 0.7}s`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   STAT CARD (left panel)
   ══════════════════════════════════════════════════════════════ */

function StatCard({ value, label, icon: Icon }: { value: string; label: string; icon: LucideIcon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="text-center group"
    >
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-2 group-hover:bg-blue-500/20 transition-colors">
        <Icon className="w-4 h-4 text-blue-400" />
      </div>
      <p className="text-2xl xl:text-3xl font-bold text-white tracking-tight" style={{ textShadow: '0 0 20px rgba(139, 92, 246, 0.4)' }}>
        {value}
      </p>
      <p className="text-white/35 text-[10px] xl:text-xs mt-1 leading-tight uppercase tracking-wider">
        {label}
      </p>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ══════════════════════════════════════════════════════════════ */

const fadeSlideUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const formChild = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

/* ══════════════════════════════════════════════════════════════
   ADMIN LOGIN PAGE
   ══════════════════════════════════════════════════════════════ */

export default function AdminLoginPage() {
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

  /* ─── Redirect if already logged in as superadmin ─── */
  useEffect(() => {
    if (authLoading) return;
    if (user && isSuperAdmin) {
      router.replace('/admin/tableau-de-bord');
    }
  }, [user, authLoading, isSuperAdmin, router]);

  /* ─── Rotate testimonials every 5s ─── */
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  /* ─── Submit handler ─── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'superadmin' }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        login(data.user);
        router.push('/admin/tableau-de-bord');
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

  /* ─── Demo fill ─── */
  const fillDemo = useCallback(() => {
    setEmail('admin@qrtags.com');
    setPassword('admin123');
  }, []);

  const currentTestimonial = TESTIMONIALS[activeTestimonial];
  const initials = currentTestimonial.name
    .split(' ')
    .map((n) => n[0])
    .join('');

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#10B981] overflow-hidden">
      {/* ════════════════════════════════════════════════════════
          LEFT PANEL — "Midnight Command Center" (desktop only)
          ════════════════════════════════════════════════════════ */}
      <div className="relative hidden lg:flex lg:w-[52%] min-h-screen flex-col overflow-hidden">
        {/* Deep midnight gradient base */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 30% 20%, rgba(0, 71, 214, 0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(0, 71, 214, 0.10) 0%, transparent 50%), linear-gradient(160deg, #10B981 0%, #059669 40%, #10B981 100%)',
            }}
          />
        </div>

        {/* Hexagonal grid overlay */}
        <HexagonalGrid />

        {/* Data flow lines */}
        <DataFlowLines />

        {/* Pulsing radar circles */}
        <PulsingCircles />

        {/* Floating violet/purple orbs */}
        <div className="absolute top-[15%] -left-16 w-72 h-72 rounded-full bg-blue-600/15 blur-[100px] animate-pulse" />
        <div
          className="absolute bottom-[20%] right-[-40px] w-80 h-80 rounded-full bg-blue-600/10 blur-[120px] animate-pulse"
          style={{ animationDelay: '1.5s' }}
        />
        <div
          className="absolute top-[50%] left-[40%] w-96 h-96 rounded-full bg-blue-500/5 blur-[150px] animate-pulse"
          style={{ animationDelay: '3s' }}
        />
        <div
          className="absolute bottom-[5%] left-[15%] w-48 h-48 rounded-full bg-yellow-500/8 blur-[80px] animate-pulse"
          style={{ animationDelay: '2s' }}
        />

        {/* ─── Left Panel Content ─── */}
        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          {/* Top: Logo in glowing frame */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <Link href="/" className="group inline-block">
              <div className="relative w-20 h-20 rounded-2xl bg-white/[0.07] backdrop-blur-sm p-2 border border-blue-500/20 flex items-center justify-center group-hover:bg-white/[0.12] group-hover:border-blue-500/40 transition-all duration-300">
                {/* Glow effect behind logo */}
                <div className="absolute -inset-1 rounded-2xl bg-blue-500/10 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <img src="/logo.png" alt="QRTags" className="w-full h-full object-contain relative z-10" />
              </div>
            </Link>
          </motion.div>

          {/* Middle: Hero Content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            {/* Floating QR illustration */}
            <motion.div
              className="relative mb-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-2xl shadow-blue-600/30">
                <QrCode className="w-10 h-10 text-white" />
                {/* Animated ring */}
                <div className="absolute -inset-2 rounded-2xl border-2 border-blue-400/30 animate-ping" style={{ animationDuration: '3s' }} />
              </div>
              {/* Decorative floating dots */}
              <div
                className="absolute -top-3 -right-3 w-5 h-5 rounded-full bg-emerald-400/70 animate-bounce"
                style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}
              />
              <div
                className="absolute -bottom-2 -right-6 w-3.5 h-3.5 rounded-full bg-amber-400/50 animate-bounce"
                style={{ animationDelay: '1.2s', animationDuration: '3s' }}
              />
              <div
                className="absolute -top-1 -left-5 w-4 h-4 rounded-full bg-blue-300/40 animate-bounce"
                style={{ animationDelay: '0.8s', animationDuration: '2.8s' }}
              />
            </motion.div>

            <motion.h2
              className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-[1.1]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
            >
              Centre de contrôle
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, #a78bfa 0%, #c4b5fd 40%, #8B5CF6 70%, #7C3AED 100%)',
                }}
              >
                de la plateforme
              </span>
              <br />
              QRTags.
            </motion.h2>

            <motion.p
              className="text-white/40 text-lg leading-relaxed mb-10 max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
            >
              Administration sécurisée. Surveillez les opérations, gérez les agences
              et pilotez l&apos;infrastructure mondiale de suivi.
            </motion.p>

            {/* Stats row */}
            <motion.div
              className="grid grid-cols-4 gap-4"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {STATS.map((stat, i) => (
                <StatCard key={i} value={stat.value} label={stat.label} icon={stat.icon} />
              ))}
            </motion.div>
          </div>

          {/* Bottom: Testimonials */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
          >
            <div className="border-l-2 border-blue-500/40 pl-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-white/50 text-sm italic leading-relaxed mb-3">
                    &ldquo;{currentTestimonial.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center border border-blue-500/30">
                      <span className="text-white text-xs font-bold">{initials}</span>
                    </div>
                    <div>
                      <p className="text-white/75 text-xs font-medium">{currentTestimonial.name}</p>
                      <p className="text-white/30 text-[10px]">{currentTestimonial.role}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dots indicator */}
            <div className="flex gap-1.5 mt-4">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeTestimonial
                      ? 'bg-blue-500 w-5'
                      : 'bg-white/15 hover:bg-white/25 w-1.5'
                  }`}
                  aria-label={`Témoignage ${i + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          RIGHT PANEL — DARK MODE FORM
          ════════════════════════════════════════════════════════ */}
      <div className="w-full lg:w-[48%] min-h-screen flex items-center justify-center bg-[#10B981] px-6 py-12 sm:px-10 relative">
        {/* Subtle right-side background treatment */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, rgba(124, 58, 237, 0.06) 0%, transparent 50%)',
            }}
          />
        </div>

        {/* Glowing accent line at top */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(90deg, #7C3AED 0%, #8B5CF6 30%, #a78bfa 50%, #8B5CF6 70%, #7C3AED 100%)',
          }}
        />

        <motion.div
          className="w-full max-w-[400px] relative z-10"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          {/* Mobile Logo */}
          <motion.div
            className="lg:hidden flex items-center justify-center mb-10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative w-20 h-20 rounded-2xl bg-white/[0.07] backdrop-blur-sm p-2 border border-blue-500/20 flex items-center justify-center">
              <div className="absolute -inset-1 rounded-2xl bg-blue-500/10 blur-lg" />
              <img src="/logo.png" alt="QRTags" className="w-full h-full object-contain relative z-10" />
            </div>
          </motion.div>

          {/* Admin Badge */}
          <motion.div className="flex items-center gap-2 mb-6" {...formChild} transition={{ delay: 0.1 }}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-600/20 text-blue-300 border border-blue-500/20">
              <Shield className="w-3 h-3" />
              Admin
            </span>
          </motion.div>

          {/* Header */}
          <motion.div className="mb-8" {...formChild} transition={{ delay: 0.2 }}>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Administration</h1>
            <p className="text-white/40 text-sm leading-relaxed">
              Accès réservé aux administrateurs de la plateforme QRTags
            </p>
          </motion.div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6 overflow-hidden"
              >
                <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-300 rounded-xl text-sm flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
                    <span className="text-red-400 text-xs font-bold">!</span>
                  </div>
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <motion.div {...formChild} transition={{ delay: 0.3 }}>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                Email
              </label>
              <div
                className={`relative flex items-center rounded-xl border transition-all duration-300 ${
                  focusedField === 'email'
                    ? 'border-blue-500 bg-[#059669] shadow-[0_0_0_4px_rgba(124,58,237,0.15),0_0_20px_rgba(124,58,237,0.1)]'
                    : 'border-white/10 bg-[#059669]/80 hover:border-white/20'
                }`}
              >
                <div
                  className={`pl-4 transition-colors duration-200 ${
                    focusedField === 'email' ? 'text-blue-400' : 'text-white/30'
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
                  className="w-full bg-transparent border-none outline-none text-white placeholder-white/25 py-3.5 px-3 text-sm"
                  placeholder="admin@qrtags.com"
                  required
                  autoComplete="email"
                />
                {/* Focus glow indicator */}
                {focusedField === 'email' && (
                  <motion.div
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-400"
                    layoutId="focus-dot"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </div>
            </motion.div>

            {/* Password Field */}
            <motion.div {...formChild} transition={{ delay: 0.4 }}>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                Mot de passe
              </label>
              <div
                className={`relative flex items-center rounded-xl border transition-all duration-300 ${
                  focusedField === 'password'
                    ? 'border-blue-500 bg-[#059669] shadow-[0_0_0_4px_rgba(124,58,237,0.15),0_0_20px_rgba(124,58,237,0.1)]'
                    : 'border-white/10 bg-[#059669]/80 hover:border-white/20'
                }`}
              >
                <div
                  className={`pl-4 transition-colors duration-200 ${
                    focusedField === 'password' ? 'text-blue-400' : 'text-white/30'
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
                  className="w-full bg-transparent border-none outline-none text-white placeholder-white/25 py-3.5 px-3 text-sm"
                  placeholder="Entrez votre mot de passe"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pr-4 text-white/30 hover:text-blue-400 transition-colors duration-200"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
                {focusedField === 'password' && (
                  <motion.div
                    className="absolute right-10 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-400"
                    layoutId="focus-dot"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </div>
            </motion.div>

            {/* Remember Me / Forgot Password */}
            <motion.div
              className="flex items-center justify-between"
              {...formChild}
              transition={{ delay: 0.5 }}
            >
              <label className="flex items-center cursor-pointer gap-2 group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500/30 focus:ring-offset-0 cursor-pointer accent-blue-600"
                />
                <span className="text-sm text-white/40 group-hover:text-white/60 transition-colors duration-200">
                  Se souvenir de moi
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors duration-200"
              >
                Mot de passe oublié ?
              </Link>
            </motion.div>

            {/* Submit Button */}
            <motion.div {...formChild} transition={{ delay: 0.6 }}>
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:scale-[0.98] shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 relative overflow-hidden group"
              >
                {/* Shimmer overlay */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </motion.div>
          </form>

          {/* Demo Account Card */}
          <motion.div
            className="mt-6 p-4 rounded-xl bg-white/[0.04] border border-blue-500/15 backdrop-blur-sm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.75 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/20 flex items-center justify-center">
                  <Fingerprint className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white/70">Compte démo</p>
                  <p className="text-[10px] text-white/25 font-mono mt-0.5">
                    admin@qrtags.com / admin123
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={fillDemo}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/20 hover:bg-blue-600/30 hover:text-blue-200 hover:border-blue-500/40 transition-all duration-200 active:scale-95"
              >
                Remplir
              </button>
            </div>
          </motion.div>

          {/* Switch to Agency */}
          <motion.div
            className="mt-8 text-center text-sm text-white/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.85 }}
          >
            Vous êtes une agence ?{' '}
            <Link
              href="/agence/connexion"
              className="font-semibold text-blue-400 hover:text-blue-300 transition-colors duration-200"
            >
              Connexion Agence
            </Link>
          </motion.div>

          {/* Bottom Links */}
          <motion.div
            className="mt-6 flex items-center justify-center gap-4 text-xs text-white/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.95 }}
          >
            <Link href="/cgu" className="hover:text-white/40 transition-colors duration-200">
              CGU
            </Link>
            <span className="text-white/10">•</span>
            <Link href="/confidentialite" className="hover:text-white/40 transition-colors duration-200">
              Confidentialité
            </Link>
            <span className="text-white/10">•</span>
            <Link href="/contact" className="hover:text-white/40 transition-colors duration-200">
              Aide
            </Link>
          </motion.div>

          {/* Security indicators at the very bottom */}
          <motion.div
            className="mt-10 flex items-center justify-center gap-4 text-[10px] text-white/15 uppercase tracking-widest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.05 }}
          >
            <div className="flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              <span>Chiffré</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <KeyRound className="w-3 h-3" />
              <span>SSL</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3" />
              <span>RGPD</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}