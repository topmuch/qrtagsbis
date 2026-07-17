import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/db';

// GET: List system logs with filters and pagination
export async function GET(req: Request) {
  const user = await getSession();
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const level = searchParams.get('level') || undefined;
  const source = searchParams.get('source') || undefined;
  const startDate = searchParams.get('startDate') || undefined;
  const endDate = searchParams.get('endDate') || undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (level) where.level = level;
  if (source) where.source = { contains: source };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    db.systemLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    db.systemLog.count({ where }),
  ]);

  return NextResponse.json({
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// DELETE: Purge logs older than 30 days
export async function DELETE(req: Request) {
  const user = await getSession();
  if (!user || user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await db.systemLog.deleteMany({
    where: { createdAt: { lt: thirtyDaysAgo } },
  });

  return NextResponse.json({
    success: true,
    deletedCount: result.count,
    message: `${result.count} logs supprimés (plus de 30 jours)`,
  });
}
