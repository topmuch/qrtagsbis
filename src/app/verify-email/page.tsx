'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, RefreshCw, Mail, ArrowLeft, ShieldCheck } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      verifyWithToken(token);
    }
  }, [token]);

  const verifyWithToken = async (token: string) => {
    setStatus('loading');
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus('success');
        setMessage('Votre email a été vérifié avec succès !');
      } else {
        setStatus('error');
        setMessage(data.error || 'Erreur lors de la vérification');
      }
    } catch {
      setStatus('error');
      setMessage('Erreur de connexion');
    }
  };

  const verifyWithCode = async () => {
    if (!code || !email) return;
    
    setVerifying(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus('success');
        setMessage('Votre email a été vérifié avec succès !');
      } else {
        setMessage(data.error || 'Code invalide');
      }
    } catch {
      setMessage('Erreur de connexion');
    } finally {
      setVerifying(false);
    }
  };

  const resendVerification = async () => {
    if (!email) return;
    
    setVerifying(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      setMessage('Si un compte existe, un nouveau code a été envoyé');
    } catch {
      setMessage('Erreur lors de l\'envoi');
    } finally {
      setVerifying(false);
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
          <p className="text-slate-500 mt-3 text-sm">Vérification de l&apos;email</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
          {status === 'loading' && token && (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-7 h-7 text-blue-600 animate-spin" />
              </div>
              <p className="text-slate-600 text-sm">Vérification en cours...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Email vérifié !</h2>
              <p className="text-slate-600 text-sm mb-6">{message}</p>
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3.5 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  boxShadow: '0 8px 24px rgba(37,99,235,0.2)',
                }}
              >
                Se connecter
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Erreur</h2>
              <p className="text-slate-600 text-sm mb-6">{message}</p>
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3.5 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors"
              >
                Retour à la connexion
              </button>
            </div>
          )}

          {/* Code verification form */}
          {status !== 'success' && (!token || status === 'error') && (
            <div>
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Entrez votre code</h2>
                <p className="text-slate-500 text-sm">
                  Entrez votre email et le code à 6 chiffres reçu par email
                </p>
              </div>

              <div className="space-y-4">
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
                      className="w-full bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 py-3.5 px-3 text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Code de vérification</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-4 py-3.5 border-2 border-slate-200 bg-slate-50/50 rounded-xl text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-slate-900 focus:bg-white transition-all font-mono"
                    maxLength={6}
                  />
                </div>

                <button
                  onClick={verifyWithCode}
                  disabled={verifying || code.length !== 6 || !email}
                  className="w-full py-3.5 text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    boxShadow: '0 8px 24px rgba(37,99,235,0.2)',
                  }}
                >
                  {verifying ? 'Vérification...' : 'Vérifier'}
                </button>

                {message && status !== 'success' && (
                  <p className="text-center text-red-500 text-sm">{message}</p>
                )}

                <button
                  onClick={resendVerification}
                  disabled={verifying || !email}
                  className="w-full py-3 text-blue-600 font-medium hover:underline text-sm disabled:opacity-50"
                >
                  Renvoyer le code
                </button>
              </div>
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
