/**
 * Types partagés pour l'intégration Wakit (WhatsApp Business) & Groq (IA)
 *
 * Ces interfaces sont utilisées par:
 * - src/lib/wakit.ts   (client Wakit)
 * - src/lib/groq.ts    (client Groq)
 * - src/app/api/notify/whatsapp/route.ts (stub Wakit)
 * - src/app/api/ai/chat/route.ts         (stub Groq)
 */

// ═══════════════════════════════════════════════════════
//  WAKIT — WhatsApp Business API
// ═══════════════════════════════════════════════════════

/** Statuts possibles d'un message WhatsApp envoyé via Wakit */
export type WakitMessageStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'fallback';

/** Payload envoyé à l'API Wakit */
export interface WakitPayload {
  /** Numéro du destinataire au format international (ex: "33612345678") */
  to: string;
  /** Nom du template WhatsApp à utiliser (ex: "baggage_scan_alert") */
  template: string;
  /** Variables du template (clé = nom de la variable dans le template) */
  variables: Record<string, string>;
}

/** Réponse de l'API Wakit */
export interface WakitResponse {
  success: boolean;
  messageId?: string;
  status?: WakitMessageStatus;
  error?: string;
}

/** Résultat normalisé retourné par le client utilitaire Wakit */
export interface WakitResult {
  success: boolean;
  messageId?: string;
  status: WakitMessageStatus;
  error?: string;
  fallback: boolean;
  latencyMs?: number;
}

// ═══════════════════════════════════════════════════════
//  GROQ — AI Inference API
// ═══════════════════════════════════════════════════════

/** Rôle d'un message dans la conversation Groq */
export type GroqMessageRole = 'system' | 'user' | 'assistant';

/** Un message dans la conversation Groq */
export interface GroqMessage {
  role: GroqMessageRole;
  content: string;
}

/** Requête envoyée à l'API Groq */
export interface GroqRequest {
  /** Modèle à utiliser (ex: "llama3-8b-8192") */
  model: string;
  /** Historique de conversation */
  messages: GroqMessage[];
  /** Température de sampling (0.0 = déterministe, 1.0 = créatif) */
  temperature?: number;
  /** Nombre max de tokens en réponse */
  max_tokens?: number;
}

/** Réponse brute de l'API Groq (champs utilisés) */
export interface GroqResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs?: number;
}

/** Résultat normalisé retourné par le client utilitaire Groq */
export interface GroqResult {
  success: boolean;
  content?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs?: number;
  error?: string;
  fallback: boolean;
}

// ═══════════════════════════════════════════════════════
//  SCAN AI ANALYSIS — Analyse IA d'un scan bagage
// ═══════════════════════════════════════════════════════

/** Types de bagages identifiables par IA */
export type BaggageType = 'cabine' | 'soute' | 'sac_à_main' | 'valise' | 'autre';

/** Couleurs de bagage détectables */
export type BaggageColor =
  | 'noir'
  | 'blanc'
  | 'gris'
  | 'rouge'
  | 'bleu'
  | 'vert'
  | 'marron'
  | 'beige'
  | 'autre';

/** Tailles de bagage */
export type BaggageSize = 'petit' | 'moyen' | 'grand' | 'extra_large';

/** Résultat de l'analyse IA d'un scan (stocké en JSON dans ScanLog.aiAnalysis) */
export interface ScanAIAnalysis {
  /** Type de bagage détecté */
  type: BaggageType;
  /** Couleur dominante du bagage */
  color: BaggageColor;
  /** Taille estimée */
  size: BaggageSize;
  /** Score de confiance de l'analyse (0.0 - 1.0) */
  confidence: number;
  /** L'IA pense qu'il s'agit d'un doublon / scan frauduleux */
  isDuplicate: boolean;
  /** Description textuelle générée par l'IA */
  description?: string;
  /** Timestamp de l'analyse */
  analyzedAt: string;
}

// ─── AI-FEATURE: Scan Suspicion Analysis (Feature #2) ───

/** Résultat de l'analyse anti-doublon Groq */
export interface ScanSuspicionAnalysis {
  /** true si le scan est suspect (doublon, bot, incohérence géographique) */
  isSuspicious: boolean;
  /** Raison de la suspicion (stocké dans aiAnalysis JSON) */
  reason: string;
  /** Score de confiance (0.0 - 1.0) */
  confidence: number;
  /** Timestamp de l'analyse */
  analyzedAt: string;
}

// ═══════════════════════════════════════════════════════
//  SERVICE RESULT — Type générique pour les résultats
// ═══════════════════════════════════════════════════════

/** Résultat générique d'un appel de service externe */
export interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fallback: boolean;
  latencyMs?: number;
}
