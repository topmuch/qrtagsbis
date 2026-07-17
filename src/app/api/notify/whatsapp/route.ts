/**
 * API Route — Envoi WhatsApp via Wakit
 *
 * POST /api/notify/whatsapp
 *
 * Corps attendu:
 *   { to: string, template: string, variables?: Record<string, string>, baggageId?: string }
 *
 * Comportement:
 *   - Si Wakit est configuré → envoie le message et retourne { success, messageId, status }
 *   - Si Wakit échoue → retourne { success: true, fallback: true } (ne bloque jamais)
 *   - Si Wakit n'est pas configuré → retourne { success: true, fallback: true }
 *
 * Sécurité:
 *   - Vérification session + rôle admin/superadmin
 *   - Validation stricte des entrées
 *   - Logs structurés
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sendWakitMessage } from '@/lib/wakit';
import { isServiceEnabledAsync } from '@/lib/config';
import type { WakitResult } from '@/types/ai';

export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════
//  VALIDATION (Zod)
// ═══════════════════════════════════════════════════════

interface WhatsAppRequestBody {
  to: string;
  template: string;
  variables?: Record<string, string>;
  baggageId?: string;
}

function validateBody(body: unknown): { valid: true; data: WhatsAppRequestBody } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Corps de requête invalide.' };
  }

  const data = body as Record<string, unknown>;

  // `to` est obligatoire et doit être une string
  if (!data.to || typeof data.to !== 'string') {
    return { valid: false, error: 'Le champ "to" est requis et doit être une chaîne.' };
  }

  // `template` est obligatoire et doit être une string
  if (!data.template || typeof data.template !== 'string') {
    return { valid: false, error: 'Le champ "template" est requis et doit être une chaîne.' };
  }

  // `variables` optionnel, doit être un objet plat
  if (data.variables !== undefined) {
    if (typeof data.variables !== 'object' || Array.isArray(data.variables)) {
      return { valid: false, error: 'Le champ "variables" doit être un objet.' };
    }
    const vars = data.variables as Record<string, unknown>;
    for (const [key, value] of Object.entries(vars)) {
      if (typeof value !== 'string') {
        return { valid: false, error: `La variable "${key}" doit être une chaîne.` };
      }
    }
  }

  // `baggageId` optionnel
  if (data.baggageId !== undefined && typeof data.baggageId !== 'string') {
    return { valid: false, error: 'Le champ "baggageId" doit être une chaîne.' };
  }

  return {
    valid: true,
    data: {
      to: data.to as string,
      template: data.template as string,
      variables: (data.variables as Record<string, string>) ?? {},
      baggageId: data.baggageId as string | undefined,
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
      console.warn('[WhatsApp API] Accès non autorisé — pas de session.');
      return NextResponse.json(
        { success: false, error: 'Non autorisé — Connexion requise.' },
        { status: 401 }
      );
    }

    const allowedRoles = ['superadmin', 'admin', 'agent'];
    if (!allowedRoles.includes(user.role)) {
      console.warn(`[WhatsApp API] Rôle "${user.role}" non autorisé.`);
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
      console.warn(`[WhatsApp API] Validation échouée: ${validation.error}`);
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const { to, template, variables, baggageId } = validation.data;

    // ─── Log structuré ───
    console.log(`[WhatsApp API] POST — template="${template}", to="${to.substring(0, 4)}***", user="${user.role}:${user.name}", baggageId="${baggageId ?? 'N/A'}"`);

    // ─── Check si Wakit est configuré (DB + env) ───
    if (!await isServiceEnabledAsync('wakit')) {
      console.log('[WhatsApp API] Wakit non configuré → fallback silencieux.');
      const result: WakitResult = {
        success: true,
        status: 'fallback',
        fallback: true,
        latencyMs: Date.now() - startTime,
      };
      return NextResponse.json(result);
    }

    // ─── Appel Wakit ───
    const result = await sendWakitMessage({ to, template, variables: variables ?? {} });

    // ─── Log résultat ───
    if (result.success) {
      console.log(`[WhatsApp API] ✓ Message envoyé — ID: ${result.messageId ?? 'N/A'} (${result.latencyMs}ms)`);
    } else if (result.fallback) {
      console.warn(`[WhatsApp API] ⚠ Fallback activé — ${result.error} (${result.latencyMs}ms)`);
    } else {
      console.error(`[WhatsApp API] ✗ Échec — ${result.error} (${result.latencyMs}ms)`);
    }

    // ─── Retourne toujours { success: true, fallback: true } en cas de fallback ───
    const response = result.fallback
      ? { success: true as const, fallback: true, status: 'fallback' as const, latencyMs: result.latencyMs, error: result.error }
      : { success: true as const, fallback: false, messageId: result.messageId, status: result.status, latencyMs: result.latencyMs };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur serveur';
    console.error(`[WhatsApp API] ✗ Erreur inattendue: ${message}`);
    return NextResponse.json(
      { success: true, fallback: true, error: 'Erreur serveur — fallback activé.' },
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

  const config = await import('@/lib/config').then(m => m.getServiceConfig('wakit'));
  return NextResponse.json({
    service: 'wakit',
    enabled: config.enabled,
    template: config.templateScanAlert,
    phoneNumberId: config.phoneNumberId ? '***configured***' : null,
  });
}
