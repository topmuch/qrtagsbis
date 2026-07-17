import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

// GET - Get advertisement statistics (SuperAdmin only)
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const session = await db.session.findUnique({
      where: { id: sessionToken },
      include: { user: true }
    });

    if (!session || session.user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const advertisementId = searchParams.get('id');
    const days = parseInt(searchParams.get('days') || '30');

    // Get date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // If specific advertisement, get detailed stats
    if (advertisementId) {
      const ad = await db.advertisement.findUnique({
        where: { id: advertisementId },
        include: {
          adImpressions: {
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            }
          }
        }
      });

      if (!ad) {
        return NextResponse.json(
          { error: 'Publicité non trouvée' },
          { status: 404 }
        );
      }

      // Group impressions by day
      const dailyStats: Record<string, { impressions: number; clicks: number }> = {};
      
      ad.adImpressions.forEach(imp => {
        const day = imp.createdAt.toISOString().split('T')[0];
        if (!dailyStats[day]) {
          dailyStats[day] = { impressions: 0, clicks: 0 };
        }
        if (imp.action === 'impression') {
          dailyStats[day].impressions++;
        } else {
          dailyStats[day].clicks++;
        }
      });

      // Convert to array and sort
      const chartData = Object.entries(dailyStats)
        .map(([date, stats]) => ({
          date,
          ...stats,
          ctr: stats.impressions > 0 ? ((stats.clicks / stats.impressions) * 100).toFixed(2) : '0.00'
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return NextResponse.json({
        advertisement: ad,
        chartData,
        summary: {
          totalImpressions: ad.impressions,
          totalClicks: ad.clicks,
          ctr: ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00'
        }
      });
    }

    // Get overview stats for all advertisements
    const allAds = await db.advertisement.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        impressions: true,
        clicks: true,
        createdAt: true
      }
    });

    // Calculate totals
    const totalImpressions = allAds.reduce((sum, ad) => sum + ad.impressions, 0);
    const totalClicks = allAds.reduce((sum, ad) => sum + ad.clicks, 0);
    const activeAds = allAds.filter(ad => ad.status === 'active').length;

    // Top 3 by clicks
    const topAds = [...allAds]
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 3)
      .map(ad => ({
        ...ad,
        ctr: ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00'
      }));

    // Get daily stats for all ads
    const allImpressions = await db.adImpression.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const dailyStats: Record<string, { impressions: number; clicks: number }> = {};
    allImpressions.forEach(imp => {
      const day = imp.createdAt.toISOString().split('T')[0];
      if (!dailyStats[day]) {
        dailyStats[day] = { impressions: 0, clicks: 0 };
      }
      if (imp.action === 'impression') {
        dailyStats[day].impressions++;
      } else {
        dailyStats[day].clicks++;
      }
    });

    const chartData = Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        ...stats
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      summary: {
        totalAds: allAds.length,
        activeAds,
        totalImpressions,
        totalClicks,
        avgCtr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00'
      },
      topAds,
      chartData
    });

  } catch (error) {
    console.error('Error fetching advertisement stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    );
  }
}
