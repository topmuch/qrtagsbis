'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings,
  MessageSquare,
  MapPin,
  FileText,
  Bell,
  Globe,
  BarChart3,
  Upload,
  Webhook,
  Zap,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Shield,
  Languages,
  Sparkles,
  Brain,
  AlertTriangle,
  Play,
  X,
  Save,
  ExternalLink,
  Info
} from "lucide-react";

// Icon mapping
const ICON_MAP: Record<string, React.ElementType> = {
  MessageSquare,
  MapPin,
  FileText,
  Bell,
  Globe,
  BarChart3,
  Upload,
  Webhook,
  Zap,
  Settings,
  Shield,
  Languages,
  Sparkles,
  Brain,
};

// Features that require external API configuration
const NEEDS_CONFIG: string[] = [
  'whatsapp_automated',
  'geolocation_advanced',
  'push_notifications',
  'api_webhooks',
  'wakit_api',
  'groq_api',
];

// Features that can be tested
const TESTABLE_FEATURES: string[] = [
  'whatsapp_automated',
  'geolocation_advanced',
  'push_notifications',
  'api_webhooks',
  'wakit_api',
  'groq_api',
  'ai_translation',
  'ai_fraud_detection',
  'ai_message_summary',
  'ai_qr_suggestions',
];

// Configuration fields for each feature
const CONFIG_FIELDS: Record<string, {
  title: string;
  description: string;
  fields: {
    key: string;
    label: string;
    type: 'text' | 'password' | 'textarea' | 'switch';
    placeholder?: string;
    help?: string;
  }[];
  helpLink?: { url: string; label: string };
}> = {
  whatsapp_automated: {
    title: 'Configuration WhatsApp',
    description: 'Configurez votre API WhatsApp Business (Green API) pour l\'envoi automatisé de messages.',
    fields: [
      {
        key: 'whatsapp_instance_id',
        label: 'Instance ID',
        type: 'text',
        placeholder: 'ex: 7101234567',
        help: 'L\'identifiant de votre instance Green API'
      },
      {
        key: 'whatsapp_api_key',
        label: 'Clé API',
        type: 'password',
        placeholder: 'ex: abc123def456...',
        help: 'Votre clé API secrète Green API'
      },
    ],
    helpLink: {
      url: 'https://green-api.com/docs/api/',
      label: 'Documentation Green API'
    }
  },
  geolocation_advanced: {
    title: 'Configuration Géolocalisation',
    description: 'Choisissez entre Nominatim (gratuit) ou Google Maps API pour la conversion GPS → adresse.',
    fields: [
      {
        key: 'nominatim_enabled',
        label: 'Utiliser Nominatim (gratuit)',
        type: 'switch',
        help: 'Service de géocodage gratuit OpenStreetMap'
      },
      {
        key: 'google_maps_api_key',
        label: 'Clé API Google Maps',
        type: 'password',
        placeholder: 'ex: AIzaSy...',
        help: 'Optionnel si Nominatim est activé'
      },
    ],
    helpLink: {
      url: 'https://developers.google.com/maps/documentation/geocoding/get-api-key',
      label: 'Obtenir une clé Google Maps'
    }
  },
  push_notifications: {
    title: 'Configuration Notifications Push',
    description: 'Les notifications push utilisent WhatsApp pour alerter les chefs d\'agence.',
    fields: [
      {
        key: 'whatsapp_instance_id',
        label: 'Instance ID WhatsApp',
        type: 'text',
        placeholder: 'ex: 7101234567',
        help: 'Partagé avec la configuration WhatsApp'
      },
      {
        key: 'whatsapp_api_key',
        label: 'Clé API WhatsApp',
        type: 'password',
        placeholder: 'ex: abc123def456...',
        help: 'Partagé avec la configuration WhatsApp'
      },
    ],
  },
  api_webhooks: {
    title: 'Configuration Webhooks',
    description: 'Envoyez des notifications à des URLs externes lors des événements (scan, perte, etc.).',
    fields: [
      {
        key: 'webhook_urls',
        label: 'URLs des webhooks',
        type: 'textarea',
        placeholder: 'https://votre-serveur.com/webhook\nhttps://api.exemple.com/notify',
        help: 'Une URL par ligne. Les événements seront envoyés en POST JSON.'
      },
      {
        key: 'webhook_secret',
        label: 'Secret (optionnel)',
        type: 'password',
        placeholder: 'ex: mon_secret_123',
        help: 'Ajouté dans le header X-Webhook-Secret'
      },
    ],
  },
  // ─── Wakit (WhatsApp Business API) ───
  wakit_api: {
    title: '🔑 Configuration Wakit API',
    description: 'Connectez votre API WhatsApp Business Wakit pour l\'envoi automatisé de messages aux voyageurs.',
    fields: [
      {
        key: 'wakit_api_key',
        label: 'Clé API Wakit',
        type: 'password',
        placeholder: 'ex: wakit_sk_xxxxxxxxxxxx',
        help: 'Votre clé API secrète Wakit. Stockée de manière sécurisée en base de données.'
      },
      {
        key: 'wakit_base_url',
        label: 'URL de base API',
        type: 'text',
        placeholder: 'https://api.wakit.ai/v1',
        help: 'URL de base de l\'API Wakit (ne changez pas sauf indication)'
      },
      {
        key: 'wakit_phone_number_id',
        label: 'Phone Number ID',
        type: 'text',
        placeholder: 'ex: 7101234567',
        help: 'Identifiant du numéro WhatsApp Business associé à votre compte Wakit'
      },
      {
        key: 'wakit_template_scan_alert',
        label: 'Template d\'alerte scan',
        type: 'text',
        placeholder: 'baggage_scan_alert',
        help: 'Nom du template WhatsApp utilisé pour les alertes de scan de bagage'
      },
      {
        key: 'wakit_timeout_ms',
        label: 'Timeout (ms)',
        type: 'text',
        placeholder: '10000',
        help: 'Délai d\'attente maximum pour l\'appel API en millisecondes (défaut: 10000)'
      },
    ],
    helpLink: {
      url: 'https://www.wakit.ai/docs',
      label: 'Documentation Wakit API'
    }
  },
  // ─── Groq (AI Inference API) ───
  groq_api: {
    title: '🧠 Configuration Groq API',
    description: 'Connectez l\'API Groq pour les fonctionnalités d\'intelligence artificielle: analyse de bagages, détection de fraude, traduction, résumés.',
    fields: [
      {
        key: 'groq_api_key',
        label: 'Clé API Groq',
        type: 'password',
        placeholder: 'ex: gsk_xxxxxxxxxxxx',
        help: 'Votre clé API secrète Groq. Obtenez-la sur console.groq.com'
      },
      {
        key: 'groq_base_url',
        label: 'URL de base API',
        type: 'text',
        placeholder: 'https://api.groq.com/openai/v1/chat/completions',
        help: 'URL complète de l\'endpoint Groq (ne changez pas sauf indication). Doit inclure /chat/completions'
      },
      {
        key: 'groq_model_chat',
        label: 'Modèle Chat',
        type: 'text',
        placeholder: 'llama-3.3-70b-versatile',
        help: 'Modèle utilisé pour les conversations et résumés'
      },
      {
        key: 'groq_model_analysis',
        label: 'Modèle Analyse',
        type: 'text',
        placeholder: 'llama-3.1-8b-instant',
        help: 'Modèle utilisé pour l\'analyse de bagages et la détection de fraude'
      },
      {
        key: 'groq_timeout_ms',
        label: 'Timeout (ms)',
        type: 'text',
        placeholder: '30000',
        help: 'Délai d\'attente maximum pour l\'appel API en millisecondes (défaut: 30000)'
      },
    ],
    helpLink: {
      url: 'https://console.groq.com/docs/quickstart',
      label: 'Documentation Groq API'
    }
  },
};

interface FeatureFlag {
  id: string;
  key: string;
  label: string;
  description: string;
  category: string;
  icon: string | null;
  enabled: boolean;
  updatedAt: string;
}

interface ConfigStatus {
  configured: boolean;
  missing: string[];
}

interface FeatureData {
  flags: FeatureFlag[];
  categories: Record<string, FeatureFlag[]>;
  categoryLabels: Record<string, string>;
}

interface TestResult {
  key: string;
  success: boolean;
  message: string;
  details?: string;
  noTest?: boolean;
}

const DEFAULT_DATA: FeatureData = {
  flags: [],
  categories: {},
  categoryLabels: {},
};

export default function FonctionnalitesPage() {
  const [data, setData] = useState<FeatureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [configStatus, setConfigStatus] = useState<Record<string, ConfigStatus>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  
  // Configuration modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configFeatureKey, setConfigFeatureKey] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string | boolean>>({});
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    fetchFeatures();
    fetchConfigStatus();
  }, []);

  const fetchFeatures = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/features');
      const result = await response.json();
      
      if (result && result.categories && result.flags) {
        setData(result);
      } else {
        console.error('Invalid API response:', result);
        setData(DEFAULT_DATA);
      }
    } catch (error) {
      console.error('Error fetching features:', error);
      setData(DEFAULT_DATA);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfigStatus = async () => {
    try {
      const response = await fetch('/api/admin/features/test');
      const result = await response.json();
      if (result.configStatus) {
        setConfigStatus(result.configStatus);
      }
    } catch (error) {
      console.error('Error fetching config status:', error);
    }
  };

  const toggleFeature = async (key: string, currentEnabled: boolean) => {
    setUpdating(key);
    try {
      const response = await fetch('/api/admin/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, enabled: !currentEnabled }),
      });

      if (response.ok) {
        if (data) {
          const updatedFlags = data.flags.map(flag =>
            flag.key === key ? { ...flag, enabled: !currentEnabled } : flag
          );

          const updatedCategories: Record<string, FeatureFlag[]> = {};
          updatedFlags.forEach(flag => {
            if (!updatedCategories[flag.category]) {
              updatedCategories[flag.category] = [];
            }
            updatedCategories[flag.category].push(flag);
          });

          setData({
            ...data,
            flags: updatedFlags,
            categories: updatedCategories,
          });
        }
      }
    } catch (error) {
      console.error('Error toggling feature:', error);
    } finally {
      setUpdating(null);
    }
  };

  const testFeature = async (key: string) => {
    setTesting(key);
    setTestResult(null);
    try {
      const response = await fetch('/api/admin/features/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const result = await response.json();
      setTestResult(result);
      setShowTestModal(true);
    } catch (error) {
      console.error('Error testing feature:', error);
      setTestResult({
        key,
        success: false,
        message: 'Erreur lors du test'
      });
      setShowTestModal(true);
    } finally {
      setTesting(null);
    }
  };

  const openConfigModal = async (key: string) => {
    setConfigFeatureKey(key);
    
    // Load current settings
    try {
      const response = await fetch('/api/admin/settings');
      const result = await response.json();
      
      if (result.settings) {
        const config = CONFIG_FIELDS[key];
        if (config) {
          const values: Record<string, string | boolean> = {};
          config.fields.forEach(field => {
            if (field.type === 'switch') {
              values[field.key] = result.settings[field.key] === 'true';
            } else {
              values[field.key] = result.settings[field.key] || '';
            }
          });
          setConfigValues(values);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setConfigValues({});
    }
    
    setShowConfigModal(true);
  };

  const saveConfig = async () => {
    if (!configFeatureKey) return;
    
    setSavingConfig(true);
    try {
      const settings: Record<string, string> = {};
      Object.entries(configValues).forEach(([key, value]) => {
        settings[key] = String(value);
      });

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        setShowConfigModal(false);
        fetchConfigStatus(); // Refresh config status
      }
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setSavingConfig(false);
    }
  };

  // Toggle switch component
  const ToggleSwitch = ({ enabled, onChange, disabled }: {
    enabled: boolean;
    onChange: () => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`
        relative w-14 h-7 rounded-full transition-all duration-300
        ${enabled
          ? 'bg-blue-600'
          : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        shadow-lg
      `}
      aria-label={enabled ? 'Désactiver' : 'Activer'}
    >
      <span
        className={`
          absolute top-1 w-5 h-5 bg-white rounded-full shadow-md
          transition-transform duration-300
          ${enabled ? 'translate-x-8' : 'translate-x-1'}
        `}
      />
    </button>
  );

  // Feature card component
  const FeatureCard = ({ feature }: { feature: FeatureFlag }) => {
    const IconComponent = feature.icon ? ICON_MAP[feature.icon] || Settings : Settings;
    const isUpdating = updating === feature.key;
    const isTesting = testing === feature.key;
    const needsConfig = NEEDS_CONFIG.includes(feature.key);
    const isTestable = TESTABLE_FEATURES.includes(feature.key);
    const status = configStatus[feature.key];
    const showConfigWarning = feature.enabled && needsConfig && status && !status.configured;

    return (
      <Card className={`
        transition-all duration-300 rounded-xl
        ${feature.enabled
          ? 'bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-800 shadow-sm'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }
      `}>
        <CardContent className="p-4">
          {/* Single row: Icon + Label + Description + Badges + Toggle */}
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className={`
              w-9 h-9 rounded-lg flex items-center justify-center shrink-0
              ${feature.enabled
                ? 'bg-emerald-100 dark:bg-emerald-900/30'
                : 'bg-slate-100 dark:bg-slate-700'
              }
            `}>
              <IconComponent
                className={`w-4 h-4 ${feature.enabled ? 'text-blue-700 dark:text-blue-500' : 'text-slate-400 dark:text-slate-500'}`}
                aria-hidden="true"
              />
            </div>

            {/* Label + Description + Badges */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-slate-800 dark:text-white font-semibold text-sm">
                  {feature.label}
                </h3>
                {feature.enabled ? (
                  <span className="flex items-center gap-1 text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-blue-500 px-1.5 py-0.5 rounded-full">
                    <CheckCircle className="w-2.5 h-2.5" />
                    Activé
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                    <AlertCircle className="w-2.5 h-2.5" />
                    Désactivé
                  </span>
                )}
                {showConfigWarning && (
                  <button
                    onClick={() => openConfigModal(feature.key)}
                    className="flex items-center gap-1 text-[10px] bg-amber-100 dark:bg-blue-900/30 text-amber-700 dark:text-blue-500 px-1.5 py-0.5 rounded-full hover:bg-amber-200 cursor-pointer"
                  >
                    <AlertTriangle className="w-2.5 h-2.5" />
                    Configurer
                  </button>
                )}
                {feature.enabled && needsConfig && status?.configured && (
                  <span className="flex items-center gap-1 text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-blue-500 px-1.5 py-0.5 rounded-full">
                    <CheckCircle className="w-2.5 h-2.5" />
                    Configuré
                  </span>
                )}
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 truncate">
                {feature.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {feature.enabled && needsConfig && (
                <Button
                  onClick={() => openConfigModal(feature.key)}
                  variant="outline"
                  size="sm"
                  className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg h-7 px-2.5 text-xs"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Config
                </Button>
              )}
              {isTestable && feature.enabled && (
                <Button
                  onClick={() => testFeature(feature.key)}
                  disabled={isTesting}
                  variant="outline"
                  size="sm"
                  className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg h-7 px-2.5 text-xs"
                >
                  {isTesting ? (
                    <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Play className="w-3 h-3 mr-1" />
                  )}
                  Tester
                </Button>
              )}
              {isUpdating ? (
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
              ) : (
                <ToggleSwitch
                  enabled={feature.enabled}
                  onChange={() => toggleFeature(feature.key, feature.enabled)}
                  disabled={isUpdating}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Calculate stats
  const stats = data ? {
    total: data.flags.length,
    enabled: data.flags.filter(f => f.enabled).length,
    disabled: data.flags.filter(f => !f.enabled).length,
    configured: data.flags.filter(f => f.enabled && (!NEEDS_CONFIG.includes(f.key) || configStatus[f.key]?.configured)).length,
    needsAttention: data.flags.filter(f => f.enabled && NEEDS_CONFIG.includes(f.key) && configStatus[f.key] && !configStatus[f.key].configured).length,
  } : { total: 0, enabled: 0, disabled: 0, configured: 0, needsAttention: 0 };

  const currentConfig = configFeatureKey ? CONFIG_FIELDS[configFeatureKey] : null;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Clés et API</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Configurez les clés API et activez les fonctionnalités</p>
        </div>
        <Button
          onClick={() => { fetchFeatures(); fetchConfigStatus(); }}
          variant="outline"
          className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-slate-800 dark:text-white">{stats.total === 0 ? '—' : stats.total}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-800 shadow-sm rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-700 dark:text-blue-500">{stats.enabled === 0 ? '—' : stats.enabled}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Activées</p>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-slate-400 dark:text-slate-500">{stats.disabled === 0 ? '—' : stats.disabled}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Désactivées</p>
          </CardContent>
        </Card>
        {stats.needsAttention > 0 && (
          <Card className="bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-800 shadow-sm rounded-2xl">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-600 dark:text-blue-500">{stats.needsAttention}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">À configurer</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Warning Banner for unconfigured features */}
      {stats.needsAttention > 0 && (
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 rounded-2xl mb-8">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-blue-500 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <h3 className="text-slate-800 dark:text-white font-medium mb-1">
                  {stats.needsAttention} fonctionnalité{stats.needsAttention > 1 ? 's' : ''} nécessite{stats.needsAttention > 1 ? 'nt' : ''} une configuration
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Cliquez sur le badge <strong>"Configurer"</strong> pour paramétrer les API externes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Banner */}
      <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 rounded-2xl mb-8">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-blue-700 dark:text-blue-500 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <h3 className="text-slate-800 dark:text-white font-medium mb-1">Feature Flags modulaires</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Activez les fonctionnalités et configurez les API externes selon vos besoins.
                Les fonctionnalités IA sont prêtes à l'emploi sans configuration.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
        </div>
      )}

      {/* Features by Category */}
      {data && Object.keys(data.categories || {}).length > 0 && (
        <div className="space-y-8">
          {Object.entries(data.categories).map(([category, features]) => (
            <div key={category}>
              <h2 className="text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-8 h-px bg-slate-200 dark:bg-slate-700" />
                {data.categoryLabels?.[category] || category}
                <span className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              </h2>
              <div className="flex flex-col gap-3">
                {features.map((feature) => (
                  <FeatureCard key={feature.id} feature={feature} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No features message */}
      {data && Object.keys(data.categories || {}).length === 0 && !loading && (
        <Card className="bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm rounded-2xl">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-slate-400" aria-hidden="true" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">Aucune fonctionnalité disponible</p>
          </CardContent>
        </Card>
      )}

      {/* Test Result Modal */}
      {showTestModal && testResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {testResult.success ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-blue-700 dark:text-blue-500" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                    {testResult.success ? 'Test réussi' : 'Test échoué'}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTestModal(false)}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Résultat</p>
                  <p className="text-slate-800 dark:text-white">{testResult.message}</p>
                </div>

                {testResult.details && (
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Détails</p>
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {testResult.details}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setShowTestModal(false)}
                  className="bg-[#2563EB] hover:bg-[#2563EB]/90 text-white rounded-xl"
                >
                  Fermer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Configuration Modal */}
      {showConfigModal && currentConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                    {currentConfig.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {currentConfig.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowConfigModal(false)}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4 mt-6">
                {currentConfig.fields.map((field) => (
                  <div key={field.key}>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor={field.key} className="text-slate-700 dark:text-slate-300">
                        {field.label}
                      </Label>
                      {field.type === 'switch' && (
                        <Switch
                          id={field.key}
                          checked={configValues[field.key] === true}
                          onCheckedChange={(checked) => 
                            setConfigValues({ ...configValues, [field.key]: checked })
                          }
                        />
                      )}
                    </div>
                    
                    {field.type === 'text' && (
                      <Input
                        id={field.key}
                        type="text"
                        placeholder={field.placeholder}
                        value={(configValues[field.key] as string) || ''}
                        onChange={(e) => 
                          setConfigValues({ ...configValues, [field.key]: e.target.value })
                        }
                        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                      />
                    )}
                    
                    {field.type === 'password' && (
                      <Input
                        id={field.key}
                        type="password"
                        placeholder={field.placeholder}
                        value={(configValues[field.key] as string) || ''}
                        onChange={(e) => 
                          setConfigValues({ ...configValues, [field.key]: e.target.value })
                        }
                        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                      />
                    )}
                    
                    {field.type === 'textarea' && (
                      <Textarea
                        id={field.key}
                        placeholder={field.placeholder}
                        value={(configValues[field.key] as string) || ''}
                        onChange={(e) => 
                          setConfigValues({ ...configValues, [field.key]: e.target.value })
                        }
                        rows={3}
                        className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                      />
                    )}
                    
                    {field.help && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        {field.help}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {currentConfig.helpLink && (
                <a
                  href={currentConfig.helpLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-[#2563EB] hover:underline mt-4"
                >
                  <ExternalLink className="w-3 h-3" />
                  {currentConfig.helpLink.label}
                </a>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfigModal(false)}
                  className="border-slate-200 dark:border-slate-700"
                >
                  Annuler
                </Button>
                <Button
                  onClick={saveConfig}
                  disabled={savingConfig}
                  className="bg-[#2563EB] hover:bg-[#2563EB]/90 text-white"
                >
                  {savingConfig ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
