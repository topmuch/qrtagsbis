import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isPending, isActive } from '@/lib/status';

// GET - Fetch report statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const period = searchParams.get('period') || 'week'; // week, month, year
    const includeFounders = searchParams.get('founders') === 'true';

    // Calculate date ranges
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default: // week
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Base filter
    const agencyFilter = agencyId ? { agencyId } : {};

    // Fetch baggages by status
    const baggages = await db.baggage.findMany({
      where: {
        ...agencyFilter,
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        reference: true,
        status: true,
        type: true,
        createdAt: true,
        lastScanDate: true,
        declaredLostAt: true,
        foundAt: true,
        founderName: true,
        founderPhone: true,
        founderAt: true,
        travelerFirstName: true,
        travelerLastName: true,
        agency: {
          select: { name: true }
        }
      },
    });

    // Calculate statistics
    const stats = {
      total: baggages.length,
      pending_activation: baggages.filter(b => isPending(b.status)).length,
      active: baggages.filter(b => isActive(b.status)).length,
      scanned: baggages.filter(b => b.status === 'scanned').length,
      lost: baggages.filter(b => b.status === 'lost').length,
      found: baggages.filter(b => b.status === 'found').length,
      blocked: baggages.filter(b => b.status === 'blocked').length,
      hajj: baggages.filter(b => b.type === 'hajj').length,
      voyageur: baggages.filter(b => b.type === 'voyageur').length,
      withFounder: baggages.filter(b => b.founderName !== null).length,
    };

    // Recovery rate (found / (lost + found))
    const recoveryRate = stats.lost + stats.found > 0 
      ? Math.round((stats.found / (stats.lost + stats.found)) * 100) 
      : 100;

    // Daily evolution (last 7 days)
    const dailyStats: { date: string; count: number; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayBaggages = await db.baggage.count({
        where: {
          ...agencyFilter,
          createdAt: {
            gte: new Date(dateStr + 'T00:00:00.000Z'),
            lt: new Date(dateStr + 'T23:59:59.999Z'),
          },
        },
      });
      dailyStats.push({
        date: dateStr,
        count: dayBaggages,
        label: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
      });
    }

    // Weekly evolution (last 4 weeks)
    const weeklyStats: { week: number; count: number; label: string }[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekBaggages = await db.baggage.count({
        where: {
          ...agencyFilter,
          createdAt: {
            gte: weekStart,
            lt: weekEnd,
          },
        },
      });
      weeklyStats.push({
        week: 4 - i,
        count: weekBaggages,
        label: `Semaine ${4 - i}`,
      });
    }

    // Scan logs count
    const scanLogsCount = await db.scanLog.count({
      where: {
        baggage: agencyFilter,
        createdAt: { gte: startDate },
      },
    });

    // Founder stats - baggages where someone found it but no action taken yet
    // These are baggages with founder info but status is still 'scanned' or 'lost'
    const founderBaggages = includeFounders ? baggages.filter(b => 
      b.founderName && 
      (b.status === 'scanned' || b.status === 'lost')
    ).map(b => ({
      id: b.id,
      reference: b.reference,
      status: b.status,
      founderName: b.founderName,
      founderPhone: b.founderPhone,
      founderAt: b.founderAt,
      travelerName: `${b.travelerFirstName || ''} ${b.travelerLastName || ''}`.trim(),
      agencyName: b.agency?.name || 'N/A',
      lastScanDate: b.lastScanDate,
    })) : [];

    return NextResponse.json({
      stats,
      recoveryRate,
      dailyStats,
      weeklyStats,
      scanLogsCount,
      period,
      founderBaggages,
    });
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
