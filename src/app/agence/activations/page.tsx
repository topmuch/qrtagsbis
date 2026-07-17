'use client';

import { useState, useEffect } from 'react';
import {
  QrCode,
  CheckCircle,
  Tag,
  MapPin,
  Plus,
  Loader2,
  Building,
  Clock,
  AlertCircle
} from "lucide-react";
import { useAgency } from '../layout';
import { AGENCY_TYPES, type AgencyType, type AgencyFieldDef } from '@/lib/agency-types';
import { getTagStatusInfo } from '@/lib/qr';
import { normalizeStatus } from '@/lib/status';

interface RecentlyActivated {
  id: string;
  serialNumber: string;
  itemName: string | null;
  ownerName: string | null;
  status: string;
  activatedAt: string | null;
  itemCategory: string | null;
}

const CATEGORIES = [
  { value: 'bagage', label: 'Bagage' },
  { value: 'electronique', label: 'Électronique' },
  { value: 'documents', label: 'Documents' },
  { value: 'vetements', label: 'Vêtements' },
  { value: 'accessoires', label: 'Accessoires' },
  { value: 'autres', label: 'Autres' },
];

export default function ActivationsPage() {
  const { agencyId } = useAgency();
  const [serialNumber, setSerialNumber] = useState('');
  const [serialError, setSerialError] = useState('');
  const [agencyType, setAgencyType] = useState<AgencyType>('hotel');
  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [locationBuilding, setLocationBuilding] = useState('');
  const [locationRoom, setLocationRoom] = useState('');
  const [locationNote, setLocationNote] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recentTags, setRecentTags] = useState<RecentlyActivated[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    fetchRecentTags();
  }, [agencyId]);

  const fetchRecentTags = async () => {
    try {
      const res = await fetch(`/api/agency/activations?agencyId=${agencyId}`);
      const data = await res.json();
      setRecentTags(data.tags || []);
    } catch (error) {
      console.error('Error fetching recent tags:', error);
    } finally {
      setLoadingRecent(false);
    }
  };

  // Validate serial number format: TAG-TYPE-XXXXXX
  const validateSerial = (serial: string): boolean => {
    const pattern = /^TAG-[A-Z]+-[A-Z0-9]{6}$/;
    return pattern.test(serial);
  };

  const handleSerialChange = (value: string) => {
    setSerialNumber(value.toUpperCase());
    if (value && !validateSerial(value.toUpperCase())) {
      setSerialError('Format: TAG-TYPE-XXXXXX (ex: TAG-HOTEL-MLQGY7)');
    } else {
      setSerialError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber || serialError) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/agency/activations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId,
          serialNumber,
          dynamicFields,
          itemName,
          itemCategory,
          locationBuilding,
          locationRoom,
          locationNote,
          ownerName,
          ownerPhone,
          ownerEmail,
          agencyType,
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        // Reset form
        setSerialNumber('');
        setDynamicFields({});
        setItemName('');
        setItemCategory('');
        setLocationBuilding('');
        setLocationRoom('');
        setLocationNote('');
        setOwnerName('');
        setOwnerPhone('');
        setOwnerEmail('');
        fetchRecentTags();
      }
    } catch (error) {
      console.error('Error activating tag:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const currentFields: AgencyFieldDef[] = AGENCY_TYPES[agencyType]?.fields || [];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Activer des Tags</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Associez un tag à un objet et un propriétaire</p>
      </div>

      {/* Success message */}
      {success && (
        <div className="mb-6 p-4 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-[#10B981]" />
          <span className="text-[#10B981] font-medium">Tag activé avec succès !</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Activation Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Serial Number */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                <span className="text-[#10B981] font-bold text-sm">1</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Numéro de série du tag</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                N° Série du tag
              </label>
              <div className="relative">
                <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => handleSerialChange(e.target.value)}
                  placeholder="TAG-HOTEL-MLQGY7"
                  className={`w-full bg-slate-50 dark:bg-slate-800 border ${serialError ? 'border-rose-300 dark:border-rose-700' : 'border-slate-200 dark:border-slate-700'} rounded-xl py-3 pl-11 pr-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all font-mono`}
                />
              </div>
              {serialError && (
                <p className="text-rose-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {serialError}
                </p>
              )}
            </div>
          </div>

          {/* Step 2: Dynamic Fields */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
                <span className="text-[#F59E0B] font-bold text-sm">2</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Informations spécifiques</h2>
            </div>

            {/* Agency Type Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Type d&apos;agence</label>
              <select
                value={agencyType}
                onChange={(e) => { setAgencyType(e.target.value as AgencyType); setDynamicFields({}); }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
              >
                {Object.entries(AGENCY_TYPES).map(([key, def]) => (
                  <option key={key} value={key}>{def.name}</option>
                ))}
              </select>
            </div>

            {/* Dynamic fields based on agency type */}
            {currentFields.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-4">
                {currentFields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {field.label}
                      {field.required && <span className="text-rose-500 ml-1">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={dynamicFields[field.name] || ''}
                        onChange={(e) => setDynamicFields({ ...dynamicFields, [field.name]: e.target.value })}
                        placeholder={field.label}
                        rows={3}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all resize-none"
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={dynamicFields[field.name] || ''}
                        onChange={(e) => setDynamicFields({ ...dynamicFields, [field.name]: e.target.value })}
                        placeholder={field.label}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Owner info */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Propriétaire</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nom</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Nom du propriétaire"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="+221 77 123 45 67"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="email@exemple.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Item Description & Location */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <span className="text-emerald-600 font-bold text-sm">3</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Objet & Localisation</h2>
            </div>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nom de l&apos;objet
                  </label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Valise bleue, MacBook Pro..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
                  >
                    <option value="">Sélectionner...</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    <Building className="w-3 h-3 inline mr-1" />
                    Bâtiment / Zone
                  </label>
                  <input
                    type="text"
                    value={locationBuilding}
                    onChange={(e) => setLocationBuilding(e.target.value)}
                    placeholder="Bâtiment A"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    Chambre / Pièce
                  </label>
                  <input
                    type="text"
                    value={locationRoom}
                    onChange={(e) => setLocationRoom(e.target.value)}
                    placeholder="Chambre 204"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes</label>
                  <input
                    type="text"
                    value={locationNote}
                    onChange={(e) => setLocationNote(e.target.value)}
                    placeholder="3e étage, côté mer"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !serialNumber || !!serialError}
                className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Activation en cours...
                  </>
                ) : (
                  <>
                    <Tag className="w-4 h-4" />
                    Activer le tag
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Recently Activated */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-[#10B981]" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Récemment activés</h2>
            </div>

            {loadingRecent ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
              </div>
            ) : recentTags.length === 0 ? (
              <div className="text-center py-8">
                <Tag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Aucun tag activé récemment</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {recentTags.map((tag) => {
                  const statusInfo = getTagStatusInfo(normalizeStatus(tag.status));
                  return (
                    <div key={tag.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center shrink-0">
                        <QrCode className="w-4 h-4 text-[#10B981]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono font-medium text-slate-800 dark:text-white truncate">
                          {tag.serialNumber}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {tag.itemName || tag.ownerName || 'Non renseigné'}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusInfo.bgColor} ${statusInfo.color} shrink-0`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-br from-[#10B981]/10 to-[#F59E0B]/10 border border-[#10B981]/20 rounded-2xl p-6">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#10B981]" />
              Comment ça marche ?
            </h3>
            <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-[#10B981] font-bold shrink-0">1.</span>
                Entrez le numéro de série du tag ou scannez le QR code
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#F59E0B] font-bold shrink-0">2.</span>
                Remplissez les informations du propriétaire et de l&apos;objet
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#10B981] font-bold shrink-0">3.</span>
                Décrivez l&apos;objet et sa localisation, puis validez
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
