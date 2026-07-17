import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Feature definitions inline
const FEATURE_DEFINITIONS = [
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
    enabled: true,
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
  // 🔐 API Services (Wakit & Groq)
  {
    key: 'wakit_api',
    label: 'Wakit — WhatsApp Business API',
    description: 'Connectez votre API WhatsApp Business (Wakit) pour l\'envoi automatisé de messages de scan et d\'alertes aux voyageurs.',
    category: 'api_services',
    icon: 'MessageSquare',
    enabled: false,
  },
  {
    key: 'groq_api',
    label: 'Groq — IA Inference API',
    description: 'Connectez l\'API Groq pour les fonctionnalités d\'intelligence artificielle: analyse de bagages, détection de fraude, traduction, résumés.',
    category: 'api_services',
    icon: 'Brain',
    enabled: false,
  },
  // 🤖 AI Features
  {
    key: 'ai_fraud_detection',
    label: 'Détection de fraude IA',
    description: '🤖 Détecte les scans suspects (multiples IPs, pays différents) et affiche des alertes. Fallback: règles métier classiques.',
    category: 'ai',
    icon: 'Shield',
    enabled: false,
  },
  {
    key: 'ai_translation',
    label: 'Traduction automatique IA',
    description: '🤖 Traduit automatiquement les messages WhatsApp dans la langue du propriétaire. Gratuit ≤500 req/jour.',
    category: 'ai',
    icon: 'Languages',
    enabled: false,
  },
  {
    key: 'ai_message_summary',
    label: 'Résumé IA des messages',
    description: '🤖 Génère un résumé en 1 ligne des longs messages partenaires via Hugging Face API.',
    category: 'ai',
    icon: 'Sparkles',
    enabled: false,
  },
  {
    key: 'ai_qr_suggestions',
    label: 'Suggestions QR intelligentes',
    description: '🤖 Recommande un volume de QR codes aux agences basé sur l\'historique. Régression linéaire simple.',
    category: 'ai',
    icon: 'Brain',
    enabled: false,
  },
];

// GET - Fetch all feature flags
export async function GET() {
  try {
    type FeatureFlagType = {
      id: string;
      key: string;
      label: string;
      description: string;
      category: string;
      icon: string | null;
      enabled: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
    
    let existingFlags: FeatureFlagType[] = [];

    try {
      existingFlags = await db.featureFlag.findMany();
    } catch (dbError) {
      console.error('Database query error:', dbError);
      // Continue with empty array
    }

    const existingKeys = new Set(existingFlags.map((f) => f.key));

    // Create missing flags from definitions
    const missingFlags = FEATURE_DEFINITIONS.filter(
      def => !existingKeys.has(def.key)
    );

    if (missingFlags.length > 0) {
      try {
        for (const def of missingFlags) {
          await db.featureFlag.create({
            data: {
              key: def.key,
              label: def.label,
              description: def.description,
              category: def.category,
              icon: def.icon,
              enabled: def.enabled,
            }
          });
        }
        // Refetch after creating
        existingFlags = await db.featureFlag.findMany();
      } catch (createError) {
        console.error('Error creating feature flags:', createError);
      }
    }

    // Return all flags grouped by category
    const categories: Record<string, FeatureFlagType[]> = {};
    existingFlags.forEach((flag) => {
      if (!categories[flag.category]) {
        categories[flag.category] = [];
      }
      categories[flag.category].push(flag);
    });

    return NextResponse.json({
      flags: existingFlags,
      categories,
      categoryLabels: {
        general: 'Général',
        communication: 'Communication',
        geolocation: 'Géolocalisation',
        export: 'Export & Documents',
        notifications: 'Notifications',
        integration: 'Intégrations',
        ai: '🤖 Intelligence Artificielle',
        api_services: '🔐 Clés API & Services',
      }
    });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    // Return empty data instead of error
    return NextResponse.json({
      flags: [],
      categories: {},
      categoryLabels: {
        general: 'Général',
        communication: 'Communication',
        geolocation: 'Géolocalisation',
        export: 'Export & Documents',
        notifications: 'Notifications',
        integration: 'Intégrations',
        ai: '🤖 Intelligence Artificielle',
        api_services: '🔐 Clés API & Services',
      }
    });
  }
}

// PUT - Toggle a feature flag
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, enabled } = body;

    if (!key || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Clé et valeur enabled requis' },
        { status: 400 }
      );
    }

    const existingFlag = await db.featureFlag.findUnique({
      where: { key }
    });

    if (existingFlag) {
      const updated = await db.featureFlag.update({
        where: { key },
        data: { enabled }
      });
      return NextResponse.json({ success: true, flag: updated });
    } else {
      // Create from definition if exists
      const definition = FEATURE_DEFINITIONS.find(f => f.key === key);
      if (definition) {
        const created = await db.featureFlag.create({
          data: {
            key,
            label: definition.label,
            description: definition.description,
            category: definition.category,
            icon: definition.icon,
            enabled
          }
        });
        return NextResponse.json({ success: true, flag: created });
      } else {
        return NextResponse.json(
          { error: 'Fonctionnalité inconnue' },
          { status: 404 }
        );
      }
    }
  } catch (error) {
    console.error('Error toggling feature flag:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}
