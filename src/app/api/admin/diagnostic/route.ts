import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  // SuperAdmin protection
  const user = await getSession();
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const checks: { name: string; status: 'ok' | 'warn' | 'error'; detail: string; latencyMs?: number }[] = [];
  let hasCritical = false;

  // 1. DB Ping
  const dbStart = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;
    checks.push({
      name: 'Database (SQLite)',
      status: dbLatency < 100 ? 'ok' : dbLatency < 500 ? 'warn' : 'error',
      detail: `Latence: ${dbLatency}ms`,
      latencyMs: dbLatency,
    });
  } catch (e: unknown) {
    hasCritical = true;
    checks.push({
      name: 'Database (SQLite)',
      status: 'error',
      detail: `Erreur: ${e instanceof Error ? e.message : 'Unknown'}`,
    });
  }

  // 2. Environment variables
  const envVars = [
    { name: 'DATABASE_URL', required: true },
    { name: 'NEXTAUTH_SECRET', required: true },
    { name: 'GROQ_API_KEY', required: false },
    { name: 'NEXT_PUBLIC_APP_URL', required: false },
    { name: 'ENCRYPTION_KEY', required: true },
  ];

  const envMissing: string[] = [];
  const envPresent: string[] = [];
  for (const envVar of envVars) {
    const value = process.env[envVar.name];
    if (!value || value.includes('your-') || value.includes('change-in-')) {
      if (envVar.required) envMissing.push(envVar.name);
    } else {
      envPresent.push(envVar.name);
    }
  }

  if (envMissing.length > 0) {
    hasCritical = true;
    checks.push({
      name: 'Variables d\'environnement',
      status: 'error',
      detail: `Manquantes: ${envMissing.join(', ')}`,
    });
  } else {
    checks.push({
      name: 'Variables d\'environnement',
      status: 'ok',
      detail: `${envPresent.length}/${envVars.length} configurées`,
    });
  }

  // 3. FeatureFlags coherence
  try {
    const flags = await db.featureFlag.findMany();
    const enabledFlags = flags.filter(f => f.enabled);
    const disabledFlags = flags.filter(f => !f.enabled);
    checks.push({
      name: 'Feature Flags',
      status: 'ok',
      detail: `${enabledFlags.length} activées, ${disabledFlags.length} désactivées (total: ${flags.length})`,
    });
  } catch (e: unknown) {
    checks.push({
      name: 'Feature Flags',
      status: 'warn',
      detail: `Erreur lecture: ${e instanceof Error ? e.message : 'Unknown'}`,
    });
  }

  // 4. Recent errors (< 24h)
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const errorCount = await db.systemLog.count({
      where: { level: { in: ['error', 'fatal'] }, createdAt: { gte: since } },
    });
    const fatalCount = await db.systemLog.count({
      where: { level: 'fatal', createdAt: { gte: since } },
    });
    checks.push({
      name: 'Erreurs récentes (24h)',
      status: fatalCount > 10 ? 'error' : errorCount > 50 ? 'warn' : 'ok',
      detail: `${errorCount} erreurs, ${fatalCount} fatales`,
    });
  } catch (e: unknown) {
    checks.push({
      name: 'Erreurs récentes (24h)',
      status: 'warn',
      detail: `Non disponible (SystemLog vide ou erreur)`,
    });
  }

  const overallStatus = hasCritical ? 'critical' : checks.some(c => c.status === 'error') ? 'critical' : checks.some(c => c.status === 'warn') ? 'degraded' : 'healthy';

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
  });
}
