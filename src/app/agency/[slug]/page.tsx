import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { isActive } from '@/lib/status';
import { Luggage, MapPin, Clock, CheckCircle, QrCode, Phone, Mail, Globe, Search } from 'lucide-react';

// Page params type
interface PageProps {
  params: Promise<{ slug: string }>;
}

// Force dynamic rendering - no database available during Docker build
export const dynamic = 'force-dynamic';

// Public Agency Page - Shows active/scanned/found baggages for an agency
export default async function PublicAgencyPage({ params }: PageProps) {
  const { slug } = await params;

  // Fetch agency with protected baggages (active, scanned, found - but NOT lost, pending_activation, blocked)
  // 'found' means the baggage was lost and then found, so it's still protected
  const agency = await prisma.agency.findUnique({
    where: { slug },
    include: {
      baggages: {
        where: {
          status: { in: ['active', 'scanned', 'found'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 100, // Limit to 100 baggages
      },
      users: {
        where: { role: 'agency' },
        take: 1,
      },
    },
  });

  if (!agency) {
    notFound();
  }

  // Stats - include all protected baggages
  const totalBaggages = agency.baggages.length;
  const activeBaggages = agency.baggages.filter(b => isActive(b.status)).length;
  const foundBaggages = agency.baggages.filter(b => b.status === 'found').length;
  const scannedBaggages = agency.baggages.filter(b => b.status === 'scanned').length;

  // Get contact info from first user or agency
  const contactUser = agency.users[0];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#2563EB] to-[#ff9f00] rounded-2xl flex items-center justify-center shadow-lg">
                <QrCode className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{agency.name}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {agency.address || 'Adresse non renseignée'}
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="px-4 py-2 bg-emerald-100 dark:bg-blue-600/10 rounded-xl">
                <span className="text-blue-700 dark:text-blue-500 font-medium text-sm">
                  Partenaire QRTags
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center mb-3">
              <Luggage className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalBaggages}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Objets protégés</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-blue-600/20 rounded-xl flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{activeBaggages}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Actifs</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 bg-amber-100 dark:bg-blue-600/20 rounded-xl flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{scannedBaggages}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Scannés</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-xl flex items-center justify-center mb-3">
              <Search className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{foundBaggages}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Retrouvés</p>
          </div>
        </div>

        {/* Baggages List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
              Objets protégés
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {totalBaggages} objet{totalBaggages > 1 ? 's' : ''} affiché{totalBaggages > 1 ? 's' : ''}
            </span>
          </div>

          {agency.baggages.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Luggage className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400">Aucun objet actif</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                Les objets protégés apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {agency.baggages.map((baggage) => (
                <div 
                  key={baggage.id} 
                  className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#2563EB]/10 to-[#2563EB]/5 rounded-xl flex items-center justify-center">
                        <QrCode className="w-5 h-5 text-[#2563EB]" />
                      </div>
                      <div>
                        <p className="font-mono font-medium text-slate-800 dark:text-white">
                          {baggage.reference}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {baggage.travelerFirstName} {baggage.travelerLastName}
                          {baggage.type === 'hajj' && (
                            <span className="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-500 rounded-full text-xs">
                              Hajj
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        baggage.status === 'active' 
                          ? 'bg-emerald-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-500' 
                          : baggage.status === 'found'
                          ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                          : 'bg-amber-100 dark:bg-blue-600/20 text-amber-600 dark:text-blue-500'
                      }`}>
                        {baggage.status === 'active' ? 'Actif' : baggage.status === 'found' ? 'Retrouvé' : 'Scanné'}
                      </span>
                      <span className="text-sm text-slate-400 dark:text-slate-500 hidden sm:block">
                        {baggage.baggageType === 'cabine' ? 'Cabine' : 'Soute'} #{baggage.baggageIndex}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
            Contacter l&apos;agence
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {agency.phone && (
              <a 
                href={`tel:${agency.phone}`}
                className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="w-10 h-10 bg-[#2563EB]/10 rounded-xl flex items-center justify-center">
                  <Phone className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Téléphone</p>
                  <p className="text-slate-800 dark:text-white font-medium">{agency.phone}</p>
                </div>
              </a>
            )}
            {agency.email && (
              <a 
                href={`mailto:${agency.email}`}
                className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="w-10 h-10 bg-[#2563EB]/10 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                  <p className="text-slate-800 dark:text-white font-medium">{agency.email}</p>
                </div>
              </a>
            )}
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div className="w-10 h-10 bg-[#2563EB]/10 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-[#2563EB]" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Statut</p>
                <p className="text-blue-700 dark:text-blue-500 font-medium">Partenaire vérifié</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-slate-400 dark:text-slate-500 text-sm pb-8">
          <p className="flex items-center justify-center gap-2">
            <QrCode className="w-4 h-4" />
            Propulsé par <span className="font-semibold text-[#2563EB]">QRTags</span>
          </p>
          <p className="mt-1 text-xs">
            Protection intelligente des objets
          </p>
        </footer>
      </div>
    </main>
  );
}
