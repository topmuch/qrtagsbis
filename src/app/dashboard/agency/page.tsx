'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect to new agency dashboard
export default function OldAgencyDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/agence/tableau-de-bord');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
        <span className="text-slate-500">Redirection...</span>
      </div>
    </div>
  );
}
