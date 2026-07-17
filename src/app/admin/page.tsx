'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#080c1a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#b8860b]/30 border-t-[#b8860b] rounded-full animate-spin"></div>
        <p className="text-white/60 text-sm">Redirection vers le tableau de bord...</p>
      </div>
    </div>
  );
}
