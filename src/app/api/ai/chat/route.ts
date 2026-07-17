/**
 * API Route — Chat IA via Groq
 *
 * POST /api/ai/chat
 *
 * Corps attendu:
 *   { messages: GroqMessage[], model?: string, temperature?: number, max_tokens?: number }
 *
 * Comportement:
 *   - Si Groq est configuré → appel du modèle et retourne { success, content, usage }
 *   - Si Groq échoue → retourne { success: true, fallback: true } (ne bloque jamais)
 *   - Si Groq n'est pas configuré → retourne { success: true, fallback: true }
 *
 * Sécurité:
 *   - Vérification session + rôle admin/superadmin
 *   - Validation stricte des entrées
 *   - Logs structurés
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { callGroqAI } from '@/lib/groq';
import { GROQ_AI_ENABLED, isServiceEnabledAsync } from '@/lib/config';
import type { GroqMessage } from '@/types/ai';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════
//  VALIDATION
// ═══════════════════════════════════════════════════════

/** Rôles autorisés dans un message Groq */
const ALLOWED_ROLES = ['system', 'user', 'assistant'] as const;

interface ChatRequestBody {
  messages: GroqMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

function validateBody(body: unknown): { valid: true; data: ChatRequestBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Corps de requête invalide.' };
  }

  const data = body as Record<string, unknown>;

  // `messages` est obligatoire et doit être un tableau non vide
  if (!Array.isArray(data.messages) || data.messages.length === 0) {
    return { valid: false, error: 'Le champ "messages" est requis et doit être un tableau non vide.' };
  }

  // Limiter à 50 messages max pour éviter l'abus
  if (data.messages.length > 50) {
    return { valid: false, error: 'Maximum 50 messages autorisés.' };
  }

  // Valider chaque message
  for (let i = 0; i < data.messages.length; i++) {
    const msg = data.messages[i] as Record<string, unknown>;
    if (!msg.role || !msg.content) {
      return { valid: false, error: `Le message à l'index ${i} doit avoir "role" et "content".` };
    }
    if (!ALLOWED_ROLES.includes(msg.role as typeof ALLOWED_ROLES[number])) {
      return { valid: false, error: `Le rôle "${msg.role}" (index ${i}) n'est pas autorisé. Utilisez: system, user, assistant.` };
    }
    if (typeof msg.content !== 'string') {
      return { valid: false, error: `Le contenu du message à l'index ${i} doit être une chaîne.` };
    }
    // Limiter la taille de chaque message à 10 000 caractères
    if ((msg.content as string).length > 10000) {
      return { valid: false, error: `Le message à l'index ${i} dépasse 10 000 caractères.` };
    }
  }

  // `model` optionnel
  if (data.model !== undefined && typeof data.model !== 'string') {
    return { valid: false, error: 'Le champ "model" doit être une chaîne.' };
  }

  // `temperature` optionnel, entre 0 et 1
  if (data.temperature !== undefined) {
    const temp = Number(data.temperature);
    if (isNaN(temp) || temp < 0 || temp > 1) {
      return { valid: false, error: 'Le champ "temperature" doit être un nombre entre 0 et 1.' };
    }
  }

  // `max_tokens` optionnel, entre 1 et 8192
  if (data.max_tokens !== undefined) {
    const tokens = Number(data.max_tokens);
    if (isNaN(tokens) || tokens < 1 || tokens > 8192) {
      return { valid: false, error: 'Le champ "max_tokens" doit être un nombre entre 1 et 8192.' };
    }
  }

  return {
    valid: true,
    data: {
      messages: data.messages as GroqMessage[],
      model: data.model as string | undefined,
      temperature: data.temperature as number | undefined,
      max_tokens: data.max_tokens as number | undefined,
    },
  };
}

// ═══════════════════════════════════════════════════════
//  POST HANDLER
// ═══════════════════════════════════════════════════════

export async function POST(request: Request): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // ─── Auth check ───
    const user = await getSession();
    if (!user) {
      console.warn('[AI Chat API] Accès non autorisé — pas de session.');
      return NextResponse.json(
        { success: false, error: 'Non autorisé — Connexion requise.' },
        { status: 401 }
      );
    }

    const allowedRoles = ['superadmin', 'admin', 'agent'];
    if (!allowedRoles.includes(user.role)) {
      console.warn(`[AI Chat API] Rôle "${user.role}" non autorisé.`);
      return NextResponse.json(
        { success: false, error: 'Accès interdit — Rôle insuffisant.' },
        { status: 403 }
      );
    }

    // ─── Parse body ───
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Corps de requête JSON invalide.' },
        { status: 400 }
      );
    }

    // ─── Validate ───
    const validation = validateBody(rawBody);
    if (!validation.valid) {
      console.warn(`[AI Chat API] Validation échouée: ${validation.error}`);
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { messages, model, temperature, max_tokens } = validation.data;
    const resolvedModel = model ?? 'llama3-8b-8192';

    // ─── Log structuré ───
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    console.log(
      `[AI Chat API] POST — ${messages.length} messages, model="${model ?? 'default'}", user="${user.role}:${user.name}", lastMsg="${lastUserMsg?.content.substring(0, 50) ?? 'N/A'}..."`
    );

    // ─── Check si Groq est configuré (kill switch env + DB + env vars) ───
    if (!GROQ_AI_ENABLED) {
      console.log('[AI Chat API] IA désactivée via GROQ_AI_ENABLED=false (env var) → fallback.');
      return NextResponse.json({
        success: true,
        fallback: true,
        content: null,
        latencyMs: Date.now() - startTime,
      });
    }

    if (!await isServiceEnabledAsync('groq')) {
      console.log('[AI Chat API] Groq non configuré → fallback silencieux.');
      return NextResponse.json({
        success: true,
        fallback: true,
        content: null,
        latencyMs: Date.now() - startTime,
      });
    }

    // ─── Appel Groq ───
    const result = await callGroqAI({
      messages,
      model: resolvedModel,
      temperature,
      max_tokens,
    });

    // ─── Log résultat ───
    if (result.success) {
      console.log(`[AI Chat API] ✓ Réponse IA obtenue — ${result.content?.length ?? 0} caractères (${result.latencyMs}ms)`);
    } else if (result.fallback) {
      console.warn(`[AI Chat API] ⚠ Fallback activé — ${result.error} (${result.latencyMs}ms)`);
    } else {
      console.error(`[AI Chat API] ✗ Échec — ${result.error} (${result.latencyMs}ms)`);
    }

    // ─── Retourne toujours { success: true } en cas de fallback ───
    if (result.fallback) {
      return NextResponse.json({
        success: true,
        fallback: true,
        content: null,
        latencyMs: result.latencyMs,
        error: result.error,
      });
    }

    return NextResponse.json({
      success: true,
      fallback: false,
      content: result.content,
      usage: result.usage,
      latencyMs: result.latencyMs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    console.error(`[AI Chat API] ✗ Erreur inattendue: ${message}`);
    return NextResponse.json(
      { success: true, fallback: true, content: null, error: 'Erreur serveur — fallback activé.' },
      { status: 500 }
    );
  }
}

// ─── GET: Retourne le statut du service ───
export async function GET(): Promise<NextResponse> {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const config = await import('@/lib/config').then(m => m.getServiceConfig('groq'));
  return NextResponse.json({
    service: 'groq',
    enabled: config.enabled,
    modelChat: config.modelChat,
    modelAnalysis: config.modelAnalysis,
    timeoutMs: String(config.timeoutMs),
  });
}
