'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  QrCode,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Building2,
  ArrowRight,
  CheckCircle,
  Fingerprint,
  KeyRound,
  Mail,
  Lock,
  Plane,
  Luggage,
  Globe,
  Sparkles,
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

/* ══════════════════════════════════════════════
   CONFIG PER VARIANT
   ══════════════════════════════════════════════ */
type LoginVariant = 'agence' | 'superadmin';

interface LoginConfig {
  type: LoginVariant;
  title: string;
  subtitle: string;
  demoEmail: string;
  demoPassword: string;
  demoLabel: string;
  role: string;
  redirectPath: string;
  accentColor: string;
  accentHover: string;
  badgeText: string;
  badgeIcon: typeof QrCode;
  switchText: string;
  switchLink: string;
  switchHref: string;
  stats: { value: string; label: string }[];
  testimonials: { name: string; role: string; text: string }[];
}

const CONFIGS: Record<LoginVariant, LoginConfig> = {
  agence: {
    type: 'agence',
    title: 'Bienvenue',
    subtitle: 'Connectez-vous à votre espace agence pour gérer vos tags et QR codes',
    demoEmail: 'agence@qrtags.com',
    demoPassword: 'agence123',
    demoLabel: 'Agence',
    role: 'agency',
    redirectPath: '/agence/tableau-de-bord',
    accentColor: '#10B981',
    accentHover: '#059669',
    badgeText: 'Agence',
    badgeIcon: Building2,
    switchText: 'Vous êtes administrateur ?',
    switchLink: 'Connexion SuperAdmin',
    switchHref: '/admin/connexion',
    stats: [
      { value: '10K+', label: 'Objets protégés' },
      { value: '850+', label: 'Agences partenaires' },
      { value: '8+', label: 'Métiers couverts' },
      { value: '99.9%', label: 'Disponibilité' },
    ],
    testimonials: [
      { name: 'Fatou Diallo', role: 'Hôtel Lumière', text: 'QRTags a transformé notre gestion d\'objets perdus. Zéro perte depuis 2 ans.' },
      { name: 'Moussa Koné', role: 'Transport Sahel', text: 'Le dashboard est simple et efficace. Nos clients sont rassurés.' },
    ],
  },
  superadmin: {
    type: 'superadmin',
    title: 'Administration',
    subtitle: 'Accès réservé aux administrateurs de la plateforme QRTags',
    demoEmail: 'admin@qrtags.com',
    demoPassword: 'admin123',
    demoLabel: 'SuperAdmin',
    role: 'superadmin',
    redirectPath: '/admin/tableau-de-bord',
    accentColor: '#0F172A',
    accentHover: '#1E293B',
    badgeText: 'Admin',
    badgeIcon: Shield,
    switchText: 'Vous êtes une agence ?',
    switchLink: 'Connexion Agence',
    switchHref: '/agence/connexion',
    stats: [
      { value: '10K+', label: 'Objets protégés' },
      { value: '850+', label: 'Agences partenaires' },
      { value: '8+', label: 'Métiers couverts' },
      { value: '99.9%', label: 'Disponibilité' },
    ],
    testimonials: [
      { name: 'Fatou Diallo', role: 'Hôtel Lumière', text: 'QRTags a transformé notre gestion d\'objets perdus. Zéro perte depuis 2 ans.' },
      { name: 'Moussa Koné', role: 'Transport Sahel', text: 'Le dashboard est simple et efficace. Nos clients sont rassurés.' },
    ],
  },
};

/* ══════════════════════════════════════════════
   LOGIN PAGE COMPONENT
   ══════════════════════════════════════════════ */
export default function LoginPage({ variant }: { variant: LoginVariant }) {
  const config = CONFIGS[variant];
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

  // Redirect if already logged in
  useEffect(() => {
    if (authLoading) return;
    if (user && ((variant === 'agence' && isAgency) || (variant === 'superadmin' && isSuperAdmin))) {
      router.replace(config.redirectPath);
    }
  }, [user, authLoading, isAgency, isSuperAdmin, variant, router, config.redirectPath]);

  // Rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % config.testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [config.testimonials.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: config.role }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        login(data.user);
        router.push(config.redirectPath);
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
    setEmail(config.demoEmail);
    setPassword(config.demoPassword);
  };

  const isAgence = variant === 'agence';
  const BadgeIcon = config.badgeIcon;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0a0e1a]">
      {/* ─── LEFT: Dark Immersive Panel ─── */}
      <div className="relative hidden lg:flex lg:w-[52%] min-h-screen flex-col overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#0f1629] to-[#0a0e1a]" />
          {/* Animated orbs */}
          <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-emerald-600/10 blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 rounded-full bg-emerald-500/8 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-600/5 blur-[150px]" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          {/* Top: Logo */}
          <div className="flex items-center justify-between">
            <Link href="/" className="group">
              <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm p-2 border border-white/10 flex items-center justify-center group-hover:bg-white/15 transition-all">
                <img src="/logo.png" alt="QRTags" className="w-full h-full object-contain" />
              </div>
            </Link>
          </div>

          {/* Middle: Hero Content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            {/* Floating QR Code illustration */}
            <div className="relative mb-10">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-2xl shadow-emerald-600/30">
                <QrCode className="w-10 h-10 text-white" />
              </div>
              {/* Decorative floating elements */}
              <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-emerald-500/80 animate-bounce" style={{ animationDelay: '0.5s' }} />
              <div className="absolute -bottom-2 -right-6 w-4 h-4 rounded-full bg-amber-400/60 animate-bounce" style={{ animationDelay: '1s' }} />
            </div>

            <h2 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-[1.1]">
              Protégez chaque
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-200 bg-clip-text text-transparent">
                objet, en toute
              </span>
              <br />
              sérénité.
            </h2>
            <p className="text-white/50 text-lg leading-relaxed mb-10 max-w-md">
              Gérez vos tags, vos objets et vos QR codes depuis un seul tableau de bord intuitif.
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4">
              {config.stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-white font-bold text-xl xl:text-2xl">{stat.value}</p>
                  <p className="text-white/30 text-[10px] xl:text-xs mt-1 leading-tight">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: Testimonial */}
          <div className="relative">
            <div className="border-l-2 border-emerald-500/40 pl-5">
              <p className="text-white/60 text-sm italic leading-relaxed mb-3">
                &ldquo;{config.testimonials[activeTestimonial].text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {config.testimonials[activeTestimonial].name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="text-white/80 text-xs font-medium">{config.testimonials[activeTestimonial].name}</p>
                  <p className="text-white/30 text-[10px]">{config.testimonials[activeTestimonial].role}</p>
                </div>
              </div>
            </div>
            {/* Dots indicator */}
            <div className="flex gap-1.5 mt-4">
              {config.testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeTestimonial ? 'bg-emerald-500 w-4' : 'bg-white/20'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── RIGHT: Clean Form Panel ─── */}
      <div className="w-full lg:w-[48%] min-h-screen flex items-center justify-center bg-white px-6 py-12 sm:px-10 relative">
        {/* Subtle top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600" />

        <div className="w-full max-w-[400px] relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-10">
            <div className="w-20 h-20 rounded-2xl bg-slate-900 p-2.5 flex items-center justify-center">
              <img src="/logo.png" alt="QRTags" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Badge */}
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white">
              <BadgeIcon className="w-3 h-3" />
              {config.badgeText}
            </span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              {config.title}
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed">{config.subtitle}</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${
                focusedField === 'email'
                  ? 'border-slate-900 bg-white ring-4 ring-slate-900/5'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}>
                <div className={`pl-4 transition-colors ${focusedField === 'email' ? 'text-slate-900' : 'text-slate-400'}`}>
                  <Mail className="w-[18px] h-[18px]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 py-3.5 px-3 text-sm"
                  placeholder={variant === 'agence' ? 'vous@agence.com' : 'admin@qrtags.com'}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Mot de passe
              </label>
              <div className={`relative flex items-center rounded-xl border transition-all duration-200 ${
                focusedField === 'password'
                  ? 'border-slate-900 bg-white ring-4 ring-slate-900/5'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}>
                <div className={`pl-4 transition-colors ${focusedField === 'password' ? 'text-slate-900' : 'text-slate-400'}`}>
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer gap-2 group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20 cursor-pointer"
                />
                <span className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors">Se souvenir de moi</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-slate-900 hover:underline transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm bg-slate-900 hover:bg-slate-800 active:scale-[0.98] shadow-xl shadow-slate-900/20"
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
            </button>
          </form>

          {/* Demo Account Card */}
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                  <Fingerprint className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Compte démo</p>
                  <p className="text-[10px] text-slate-400 font-mono">{config.demoEmail} / {config.demoPassword}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={fillDemo}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                Remplir
              </button>
            </div>
          </div>

          {/* Switch */}
          <div className="mt-8 text-center text-sm text-slate-500">
            {config.switchText}{' '}
            <Link
              href={config.switchHref}
              className="font-semibold text-slate-900 hover:underline transition-colors"
            >
              {config.switchLink}
            </Link>
          </div>

          {/* Bottom links */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
            <Link href="/cgu" className="hover:text-slate-600 transition-colors">CGU</Link>
            <span>•</span>
            <Link href="/confidentialite" className="hover:text-slate-600 transition-colors">Confidentialité</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-slate-600 transition-colors">Aide</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
