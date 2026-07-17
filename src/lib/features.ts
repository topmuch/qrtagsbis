import { db } from './db';

// Feature flag definitions - these are the default features
export const FEATURE_DEFINITIONS = [
  {
    key: 'whatsapp_automated',
    label: 'Envoi WhatsApp automatisé',
    description: 'Envoie les messages via API (Green API) au lieu d\'ouvrir wa.me. Nécessite une configuration API.',
    category: 'communication',
    icon: 'MessageSquare',
    enabled: false,
  },
  {
    key: 'geolocation_advanced',
    label: 'Géolocalisation avancée',
    description: 'Convertit les coordonnées GPS en adresse lisible via Nominatim ou Google Maps API.',
    category: 'geolocation',
    icon: 'MapPin',
    enabled: false,
  },
  {
    key: 'pdf_stickers',
    label: 'PDF stickers professionnels',
    description: 'Génère des PDF avec logo, polices embeddées, QR centré pour impression professionnelle.',
    category: 'export',
    icon: 'FileText',
    enabled: false,
  },
  {
    key: 'push_notifications',
    label: 'Notifications push',
    description: 'Envoie des alertes SMS/WhatsApp aux chefs d\'agence quand un bagage est trouvé.',
    category: 'notifications',
    icon: 'Bell',
    enabled: false,
  },
  {
    key: 'multilingual',
    label: 'Multilingue dynamique',
    description: 'Affiche la page trouveur en français/anglais/arabe selon le pays du visiteur.',
    category: 'general',
    icon: 'Globe',
    enabled: true, // Already implemented
  },
  {
    key: 'analytics_dashboard',
    label: 'Dashboard analytiques',
    description: 'Statistiques avancées avec graphiques de scans par pays, période, et type de bagage.',
    category: 'general',
    icon: 'BarChart3',
    enabled: false,
  },
  {
    key: 'bulk_import',
    label: 'Import en masse CSV',
    description: 'Permet d\'importer des listes de voyageurs via fichier CSV pour générer les QR en lot.',
    category: 'general',
    icon: 'Upload',
    enabled: false,
  },
  {
    key: 'api_webhooks',
    label: 'Webhooks API',
    description: 'Envoie des notifications à des URLs externes quand des événements se produisent (scan, perte, etc.).',
    category: 'integration',
    icon: 'Webhook',
    enabled: false,
  },
  // 🤖 AI Features
  {
    key: 'ai_fraud_detection',
    label: 'Détection de fraude IA',
    description: '🤖 Détecte les scans suspects (multiples IPs, pays différents) et affiche des alertes. Fallback: règles métier classiques.',
    category: 'ai',
    icon: 'Shield',
    enabled: true,
  },
  {
    key: 'ai_translation',
    label: 'Traduction automatique IA',
    description: '🤖 Traduit automatiquement les messages WhatsApp dans la langue du propriétaire. Gratuit ≤500 req/jour.',
    category: 'ai',
    icon: 'Languages',
    enabled: true,
  },
  {
    key: 'ai_message_summary',
    label: 'Résumé IA des messages',
    description: '🤖 Génère un résumé en 1 ligne des longs messages partenaires via Hugging Face API.',
    category: 'ai',
    icon: 'Sparkles',
    enabled: true,
  },
  {
    key: 'ai_qr_suggestions',
    label: 'Suggestions QR intelligentes',
    description: '🤖 Recommande un volume de QR codes aux agences basé sur l\'historique. Régression linéaire simple.',
    category: 'ai',
    icon: 'Brain',
    enabled: true,
  },
  // ─── AI-FEATURE: Chatbot Trouveur (Feature #1) ───
  {
    key: 'chatbot_finder',
    label: 'Chatbot IA Trouveur',
    description: '🤖 Widget chat sur la page scan permettant au trouveur de poser des questions contextuelles sur le bagage. Utilise Groq llama-3.3-70b.',
    category: 'ai',
    icon: 'MessageSquare',
    enabled: true,
  },
  // ─── AI-FEATURE: Analyse Anti-Doublon (Feature #2) ───
  {
    key: 'scan_guard',
    label: 'Analyse Anti-Doublon IA',
    description: '🤖 Détecte les scans suspects ou redondants via Groq avant notification. Timeout 2s, fail-open si indisponible.',
    category: 'ai',
    icon: 'ShieldAlert',
    enabled: true,
  },
  // ─── AI-FEATURE: Traduction Auto (Feature #3) ───
  {
    key: 'auto_translate',
    label: 'Traduction Auto (langue trouveur)',
    description: '🌍 Détecte la langue du trouveur (Accept-Language + géoloc IP) et adapte l\'interface + notifications automatiquement.',
    category: 'ai',
    icon: 'Globe',
    enabled: true,
  },
] as const;

export type FeatureKey = typeof FEATURE_DEFINITIONS[number]['key'];

// Check if a feature is enabled
export async function isFeatureEnabled(key: string): Promise<boolean> {
  try {
    const flag = await db.featureFlag.findUnique({
      where: { key }
    });

    // If flag exists in DB, return its value
    if (flag) {
      return flag.enabled;
    }

    // If not in DB, check default from definitions
    const definition = FEATURE_DEFINITIONS.find(f => f.key === key);
    return definition?.enabled ?? false;
  } catch (error) {
    console.error(`Error checking feature flag ${key}:`, error);
    return false;
  }
}

// Get all feature flags (with defaults for missing ones)
export async function getAllFeatureFlags() {
  try {
    const existingFlags = await db.featureFlag.findMany();
    const existingKeys = new Set(existingFlags.map(f => f.key));

    // Create missing flags from definitions
    const missingFlags = FEATURE_DEFINITIONS.filter(
      def => !existingKeys.has(def.key)
    );

    if (missingFlags.length > 0) {
      await db.featureFlag.createMany({
        data: missingFlags.map(def => ({
          key: def.key,
          label: def.label,
          description: def.description,
          category: def.category,
          icon: def.icon,
          enabled: def.enabled,
        })),
        skipDuplicates: true,
      });
    }

    // Return all flags
    return await db.featureFlag.findMany({
      orderBy: [
        { category: 'asc' },
        { label: 'asc' }
      ]
    });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return [];
  }
}

// Toggle a feature flag
export async function toggleFeatureFlag(key: string, enabled: boolean): Promise<boolean> {
  try {
    const existingFlag = await db.featureFlag.findUnique({
      where: { key }
    });

    if (existingFlag) {
      await db.featureFlag.update({
        where: { key },
        data: { enabled }
      });
    } else {
      const definition = FEATURE_DEFINITIONS.find(f => f.key === key);
      if (definition) {
        await db.featureFlag.create({
          data: {
            key,
            label: definition.label,
            description: definition.description,
            category: definition.category,
            icon: definition.icon,
            enabled
          }
        });
      }
    }

    return true;
  } catch (error) {
    console.error(`Error toggling feature flag ${key}:`, error);
    return false;
  }
}

// Get features by category
export async function getFeaturesByCategory() {
  const flags = await getAllFeatureFlags();

  const categories: Record<string, typeof flags> = {};

  flags.forEach(flag => {
    if (!categories[flag.category]) {
      categories[flag.category] = [];
    }
    categories[flag.category].push(flag);
  });

  return categories;
}

// Category labels for display
export const CATEGORY_LABELS: Record<string, string> = {
  general: 'Général',
  communication: 'Communication',
  geolocation: 'Géolocalisation',
  export: 'Export & Documents',
  notifications: 'Notifications',
  integration: 'Intégrations',
  ai: '🤖 Intelligence Artificielle',
};
