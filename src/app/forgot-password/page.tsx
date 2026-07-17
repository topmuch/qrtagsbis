'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Send, CheckCircle, RefreshCw, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      setSent(true);
    } catch {
      setSent(true);
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
          <p className="text-slate-500 mt-3 text-sm">Réinitialisation du mot de passe</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
          {!sent ? (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Mot de passe oublié ?</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <div className={`relative flex items-center rounded-xl border-2 transition-all duration-200 ${
                    focusedField === 'email' ? 'border-slate-900 bg-white shadow-sm' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
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
                      placeholder="votre@email.com"
                      required
                      className="w-full bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 py-3.5 px-3 text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-3.5 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    boxShadow: '0 8px 24px rgba(37,99,235,0.2)',
                  }}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Envoyer le lien
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Email envoyé !</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Si un compte existe avec l&apos;adresse <strong className="text-slate-900">{email}</strong>, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-blue-600 font-medium hover:underline text-sm"
              >
                Renvoyer un autre email
              </button>
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
