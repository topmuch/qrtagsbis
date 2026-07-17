'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Inner component that uses useSearchParams
function LoginRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'agency';

  useEffect(() => {
    // Redirect to the appropriate login page
    if (role === 'admin') {
      router.replace('/admin/connexion');
    } else {
      router.replace('/agence/connexion');
    }
  }, [router, role]);

  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-slate-500">Redirection...</span>
      </div>
    </div>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-slate-500">Chargement...</span>
      </div>
    </div>
  );
}

// Main page with Suspense wrapper
export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginRedirect />
    </Suspense>
  );
}
