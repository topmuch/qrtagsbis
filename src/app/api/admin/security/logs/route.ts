import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

/**
 * GET /api/admin/security/logs
 * Get login audit logs (SuperAdmin only)
 */
export async function GET() {
  try {
    // Check authentication and authorization
    const user = await getSession();

    if (!user || user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Get login logs from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const logs = await db.loginLog.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: { createdAt: 'desc' },
      take: 200, // Limit to last 200 entries
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching login logs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des logs' },
      { status: 500 }
    );
  }
}
