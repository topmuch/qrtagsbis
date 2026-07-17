'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, ArrowLeft, RefreshCw, CheckCircle, ShieldCheck } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!token) {
      setError('Token manquant');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.error || 'Erreur lors de la réinitialisation');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      {/* Subtle accent glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-20 blur-[150px] pointer-events-none" style={{ background: 'rgba(37,99,235,0.15)' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <img src="/logo.png" alt="QRTags" className="h-16 w-auto object-contain" />
          </Link>
          <p className="text-slate-500 mt-3 text-sm">Nouveau mot de passe</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
          {!success ? (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Définir un nouveau mot de passe</h2>
                <p className="text-slate-500 text-sm">
                  Entrez votre nouveau mot de passe ci-dessous.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nouveau mot de passe</label>
                  <div className={`relative flex items-center rounded-xl border-2 transition-all duration-200 ${
                    focusedField === 'password' ? 'border-slate-900 bg-white shadow-sm' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
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
                      placeholder="••••••••"
                      required
                      className="w-full bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 py-3.5 px-3 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="pr-4 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Confirmer le mot de passe</label>
                  <div className={`relative flex items-center rounded-xl border-2 transition-all duration-200 ${
                    focusedField === 'confirmPassword' ? 'border-slate-900 bg-white shadow-sm' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                  }`}>
                    <div className={`pl-4 transition-colors ${focusedField === 'confirmPassword' ? 'text-slate-900' : 'text-slate-400'}`}>
                      <Lock className="w-[18px] h-[18px]" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 py-3.5 px-3 text-sm"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <span className="text-red-500 text-xs">!</span>
                    </div>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !password || !confirmPassword}
                  className="w-full py-3.5 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    boxShadow: '0 8px 24px rgba(37,99,235,0.2)',
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Réinitialisation...
                    </>
                  ) : (
                    'Réinitialiser le mot de passe'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Mot de passe réinitialisé !</h2>
              <p className="text-slate-600 text-sm mb-4">
                Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la page de connexion.
              </p>
            </div>
          )}

          {/* Back link */}
          <div className="mt-6 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
