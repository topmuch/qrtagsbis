'use client';

import { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Save,
  CheckCircle,
  Key,
  Upload,
  Palette,
  CreditCard,
  Tag
} from "lucide-react";
import { useAgency } from '../layout';
import { BRAND, ACCENT, INK } from '@/lib/brand';

export default function ProfilPage() {
  const { agencyData, userName, userEmail } = useAgency();
  const [form, setForm] = useState({
    name: agencyData?.name || '',
    email: agencyData?.email || userEmail || '',
    phone: agencyData?.phone || '',
    address: agencyData?.address || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [whiteLabel, setWhiteLabel] = useState({
    primaryColor: '#10B981',
    secondaryColor: '#F59E0B',
    customMessage: '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSuccess(true);
    setSaving(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Profil de l&apos;agence</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Gérez les informations et la personnalisation de votre agence</p>
      </div>

      {success && (
        <div
          className="mb-6 p-4 rounded-xl flex items-center gap-3 border-2"
          style={{ backgroundColor: ACCENT, borderColor: INK }}
        >
          <CheckCircle className="w-5 h-5" style={{ color: INK }} />
          <span className="font-medium" style={{ color: INK }}>Modifications enregistrées avec succès !</span>
        </div>
      )}

      <div className="space-y-6">
        {/* White-Label Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-[#10B981]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Personnalisation (White-label)</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Personnalisez l&apos;apparence de vos pages de scan</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Upload className="w-4 h-4 inline mr-2" />
                Logo de l&apos;agence
              </label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center hover:border-[#10B981] transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Cliquez ou glissez votre logo ici</p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG — Max 2MB</p>
              </div>
            </div>

            {/* Color Pickers */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Couleur principale
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={whiteLabel.primaryColor}
                    onChange={(e) => setWhiteLabel({ ...whiteLabel, primaryColor: e.target.value })}
                    className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={whiteLabel.primaryColor}
                    onChange={(e) => setWhiteLabel({ ...whiteLabel, primaryColor: e.target.value })}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm text-slate-700 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Couleur secondaire
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={whiteLabel.secondaryColor}
                    onChange={(e) => setWhiteLabel({ ...whiteLabel, secondaryColor: e.target.value })}
                    className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={whiteLabel.secondaryColor}
                    onChange={(e) => setWhiteLabel({ ...whiteLabel, secondaryColor: e.target.value })}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-4 text-sm text-slate-700 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Custom Message */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Message personnalisé (affiché lors du scan)
              </label>
              <textarea
                value={whiteLabel.customMessage}
                onChange={(e) => setWhiteLabel({ ...whiteLabel, customMessage: e.target.value })}
                placeholder="Merci de scanner ce tag. Si vous avez trouvé cet objet, veuillez nous contacter..."
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 px-4 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Agency Type & Subscription Info */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-[#10B981]" />
              <h3 className="font-semibold text-slate-800 dark:text-white">Type d&apos;agence</h3>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p className="text-sm text-slate-500 dark:text-slate-400">Type</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">Hôtel</p>
              <p className="text-xs text-slate-400 mt-1">Contactez le support pour changer de type</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-[#F59E0B]" />
              <h3 className="font-semibold text-slate-800 dark:text-white">Abonnement</h3>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p className="text-sm text-slate-500 dark:text-slate-400">Plan actuel</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white">Starter</p>
              <p className="text-xs text-slate-400 mt-1">
                <a href="/agence/portefeuille" className="text-[#10B981] hover:underline">Gérer l&apos;abonnement →</a>
              </p>
            </div>
          </div>
        </div>

        {/* Agency Info — Amber card */}
        <div
          className="rounded-2xl p-6 border-2"
          style={{ backgroundColor: ACCENT, borderColor: INK }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: INK }}
            >
              <Building className="w-5 h-5" style={{ color: ACCENT }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: INK }}>Informations de l&apos;agence</h2>
              <p className="text-sm" style={{ color: INK, opacity: 0.7 }}>Ces informations apparaîtront sur vos documents QRTags</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: INK }}>
                  <User className="w-4 h-4 inline mr-2" />
                  Nom de l&apos;agence
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-white border-2 rounded-xl py-3 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ borderColor: INK, color: INK }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: INK }}>
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white border-2 rounded-xl py-3 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ borderColor: INK, color: INK }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: INK }}>
                  <Phone className="w-4 h-4 inline mr-2" />
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-white border-2 rounded-xl py-3 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ borderColor: INK, color: INK }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: INK }}>
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Adresse
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-white border-2 rounded-xl py-3 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ borderColor: INK, color: INK }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="text-white py-3 px-6 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: BRAND }}
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </form>
        </div>

        {/* Password Change — Amber card */}
        <div
          className="rounded-2xl p-6 border-2"
          style={{ backgroundColor: ACCENT, borderColor: INK }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: INK }}
            >
              <Key className="w-5 h-5" style={{ color: ACCENT }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: INK }}>Changer le mot de passe</h2>
              <p className="text-sm" style={{ color: INK, opacity: 0.7 }}>Mettez à jour votre mot de passe régulièrement</p>
            </div>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: INK }}>Mot de passe actuel</label>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-white border-2 rounded-xl py-3 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ borderColor: INK, color: INK }}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: INK }}>Nouveau mot de passe</label>
                <input
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-white border-2 rounded-xl py-3 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ borderColor: INK, color: INK }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: INK }}>Confirmer le mot de passe</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-white border-2 rounded-xl py-3 px-4 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ borderColor: INK, color: INK }}
                />
              </div>
            </div>
            <button
              type="button"
              className="text-white py-3 px-6 rounded-xl font-medium transition-colors hover:opacity-90"
              style={{ backgroundColor: BRAND }}
            >
              Changer le mot de passe
            </button>
          </form>
        </div>

        {/* Account Stats — Emerald cards with amber accents */}
        <div className="grid md:grid-cols-3 gap-4">
          <div
            className="p-5 rounded-2xl border-2"
            style={{ backgroundColor: BRAND, borderColor: INK }}
          >
            <p className="text-sm mb-1" style={{ color: ACCENT }}>Statut du compte</p>
            <p className="text-xl font-bold text-white">Actif</p>
          </div>
          <div
            className="p-5 rounded-2xl border-2"
            style={{ backgroundColor: BRAND, borderColor: INK }}
          >
            <p className="text-sm mb-1" style={{ color: ACCENT }}>Membre depuis</p>
            <p className="text-xl font-bold text-white">Jan 2024</p>
          </div>
          <div
            className="p-5 rounded-2xl border-2"
            style={{ backgroundColor: BRAND, borderColor: INK }}
          >
            <p className="text-sm mb-1" style={{ color: ACCENT }}>Abonnement</p>
            <p className="text-xl font-bold text-white">Starter</p>
          </div>
        </div>
      </div>
    </div>
  );
}
