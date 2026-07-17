'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  QrCode,
  User,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  Building,
  Luggage,
  Send
} from 'lucide-react';

interface BaggageData {
  id: string;
  reference: string;
  type: string;
  status: string;
  travelerFirstName: string | null;
  travelerLastName: string | null;
  whatsappOwner: string | null;
  baggageIndex: number;
  baggageType: string;
  agencyId: string | null;
  agency?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  declaredLostAt: string | null;
  foundAt: string | null;
  lastScanDate: string | null;
  lastLocation: string | null;
  createdAt: string;
  // TRANSPORT-FEATURE: Transport mode + conditional fields
  transportMode?: string;
  airlineName?: string | null;
  flightNumber?: string | null;
  trainCompany?: string | null;
  trainNumber?: string | null;
  shipName?: string | null;
  shipCabin?: string | null;
  busCompany?: string | null;
  busLineNumber?: string | null;
  destination?: string | null;
  departureDate?: string | null;
  departureTime?: string | null;
}

export default function AdminBaggageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const baggageId = params.id as string;

  const [baggage, setBaggage] = useState<BaggageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBaggage();
  }, [baggageId]);

  const fetchBaggage = async () => {
    try {
      const response = await fetch(`/api/baggage/${baggageId}`);
      if (response.ok) {
        const data = await response.json();
        setBaggage(data);
      } else {
        console.error('Baggage not found');
        router.push('/admin/qrcodes');
      }
    } catch (error) {
      console.error('Error fetching baggage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkFound = async () => {
    if (!confirm('✅ Marquer ce bagage comme retrouvé ?')) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/baggage/${baggageId}/mark-found`, {
        method: 'PUT',
      });
      if (response.ok) {
        fetchBaggage();
      }
    } catch (error) {
      console.error('Error marking found:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      pending_activation: { label: 'En attente', className: 'bg-amber-100 text-amber-700' },
      active: { label: 'Actif', className: 'bg-emerald-100 text-emerald-700' },
      scanned: { label: 'Scanné', className: 'bg-blue-100 text-blue-700' },
      lost: { label: 'Perdu', className: 'bg-rose-100 text-rose-700' },
      found: { label: 'Retrouvé', className: 'bg-green-100 text-green-700' },
    };
    const { label, className } = config[status] || { label: status, className: 'bg-slate-100 text-slate-600' };
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${className}`}>{label}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#b8860b]/30 border-t-[#b8860b] rounded-full animate-spin" />
      </div>
    );
  }

  if (!baggage) {
    return (
      <div className="min-h-screen bg-[#080c1a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white">Bagage non trouvé</p>
          <Link href="/admin/qrcodes" className="text-[#b8860b] hover:underline mt-4 block">
            Retour aux QR codes
          </Link>
        </div>
      </div>
    );
  }

  const isLost = baggage.status === 'lost' && baggage.declaredLostAt && !baggage.foundAt;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/qrcodes"
          className="inline-flex items-center gap-2 text-[#a0a8b8] hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux QR codes
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-[#b8860b] rounded-lg flex items-center justify-center">
            <Luggage className="w-5 h-5 text-white" />
          </div>
          Détails du bagage
        </h1>
      </div>

      {/* Lost Alert */}
      {isLost && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-rose-400">Bagage déclaré perdu</h3>
            <p className="text-rose-300/80 text-sm mt-1">
              Déclaré perdu le {formatDate(baggage.declaredLostAt)}
            </p>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-[#0d152a] border border-[#1a2238] rounded-xl overflow-hidden">
        {/* Reference Header */}
        <div className="p-6 border-b border-[#1a2238] bg-[#080c1a]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#b8860b] text-sm font-medium">{baggage.type === 'hajj' ? 'Hajj 2026' : 'Voyageur'}</p>
              <h2 className="text-xl font-bold text-white font-mono">{baggage.reference}</h2>
            </div>
            {getStatusBadge(baggage.status)}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Traveler Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-[#b8860b]" />
              Informations du voyageur
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#111827] rounded-lg p-4">
                <p className="text-[#a0a8b8] text-sm">Nom complet</p>
                <p className="text-white font-medium mt-1">
                  {baggage.travelerFirstName} {baggage.travelerLastName}
                </p>
              </div>
              <div className="bg-[#111827] rounded-lg p-4">
                <p className="text-[#a0a8b8] text-sm">WhatsApp</p>
                <p className="text-white font-medium mt-1 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#b8860b]" />
                  {baggage.whatsappOwner || 'Non renseigné'}
                </p>
              </div>
            </div>
          </div>

          {/* Agency Info */}
          {baggage.agency && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-[#b8860b]" />
                Agence
              </h3>
              <div className="bg-[#111827] rounded-lg p-4">
                <p className="text-white font-medium">{baggage.agency.name}</p>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#a0a8b8]">
                  {baggage.agency.email && (
                    <span>{baggage.agency.email}</span>
                  )}
                  {baggage.agency.phone && (
                    <span>{baggage.agency.phone}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Baggage Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Luggage className="w-5 h-5 text-[#b8860b]" />
              Détails du bagage
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-[#111827] rounded-lg p-4">
                <p className="text-[#a0a8b8] text-sm">Type</p>
                <p className="text-white font-medium mt-1">
                  {baggage.baggageType} #{baggage.baggageIndex}
                </p>
              </div>
              <div className="bg-[#111827] rounded-lg p-4">
                <p className="text-[#a0a8b8] text-sm">Créé le</p>
                <p className="text-white font-medium mt-1">{formatDate(baggage.createdAt)}</p>
              </div>
              <div className="bg-[#111827] rounded-lg p-4">
                <p className="text-[#a0a8b8] text-sm">Dernier scan</p>
                <p className="text-white font-medium mt-1">{formatDate(baggage.lastScanDate)}</p>
              </div>
            </div>
          </div>

          {/* TRANSPORT-FEATURE: Transport mode info */}
          {baggage.transportMode && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#b8860b]" />
                Informations de transport
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-[#111827] rounded-lg p-4">
                  <p className="text-[#a0a8b8] text-sm">Mode</p>
                  <p className="text-white font-medium mt-1">
                    {(() => {
                      const icons: Record<string, string> = { flight: '✈️ Avion', train: '🚆 Train', boat: '🚢 Bateau', bus: '🚌 Bus' };
                      return icons[baggage.transportMode || 'flight'] || '✈️ Avion';
                    })()}
                  </p>
                </div>
                {baggage.transportMode === 'flight' && (baggage.airlineName || baggage.flightNumber) && (
                  <div className="bg-[#111827] rounded-lg p-4">
                    <p className="text-[#a0a8b8] text-sm">Vol</p>
                    <p className="text-white font-medium mt-1">
                      {baggage.airlineName}{baggage.flightNumber ? ` — ${baggage.flightNumber}` : ''}
                    </p>
                  </div>
                )}
                {baggage.transportMode === 'train' && (baggage.trainCompany || baggage.trainNumber) && (
                  <div className="bg-[#111827] rounded-lg p-4">
                    <p className="text-[#a0a8b8] text-sm">Train</p>
                    <p className="text-white font-medium mt-1">
                      {baggage.trainCompany}{baggage.trainNumber ? ` — ${baggage.trainNumber}` : ''}
                    </p>
                  </div>
                )}
                {baggage.transportMode === 'boat' && (baggage.shipName || baggage.shipCabin) && (
                  <div className="bg-[#111827] rounded-lg p-4">
                    <p className="text-[#a0a8b8] text-sm">Navire</p>
                    <p className="text-white font-medium mt-1">
                      {baggage.shipName}{baggage.shipCabin ? ` — ${baggage.shipCabin}` : ''}
                    </p>
                  </div>
                )}
                {baggage.transportMode === 'bus' && (baggage.busCompany || baggage.busLineNumber) && (
                  <div className="bg-[#111827] rounded-lg p-4">
                    <p className="text-[#a0a8b8] text-sm">Bus</p>
                    <p className="text-white font-medium mt-1">
                      {baggage.busCompany}{baggage.busLineNumber ? ` — ${baggage.busLineNumber}` : ''}
                    </p>
                  </div>
                )}
                {baggage.destination && (
                  <div className="bg-[#111827] rounded-lg p-4">
                    <p className="text-[#a0a8b8] text-sm">Destination</p>
                    <p className="text-white font-medium mt-1">{baggage.destination}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location */}
          {baggage.lastLocation && (
            <div className="bg-[#111827] rounded-lg p-4">
              <p className="text-[#a0a8b8] text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Dernière position connue
              </p>
              <p className="text-white font-medium mt-1">{baggage.lastLocation}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-[#1a2238] bg-[#080c1a] flex flex-wrap gap-3">
          {isLost && (
            <button
              onClick={handleMarkFound}
              disabled={actionLoading}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {actionLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Marquer comme retrouvé
                </>
              )}
            </button>
          )}
          <Link
            href={`/scan/${baggage.reference}`}
            className="flex-1 py-3 bg-[#b8860b] text-white rounded-lg font-medium hover:bg-[#3b82f6] transition-colors flex items-center justify-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            Voir la page de scan
          </Link>
        </div>
      </div>
    </div>
  );
}
