import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isActivated } from '@/lib/status';

// GET - Fetch QRTags dashboard statistics
export async function GET() {
  try {
    // Get all tags
    const tags = await db.tag.findMany({
      select: {
        id: true,
        tagType: true,
        status: true,
        createdAt: true,
        agencyId: true,
        agency: {
          select: {
            id: true,
            agencyTypeId: true,
            agencyType: {
              select: { name: true }
            }
          }
        }
      }
    });

    // Get agencies count
    const activeAgencies = await db.agency.count({ where: { active: true } });

    // Get scans this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const scansThisMonth = await db.scanLog.count({
      where: { createdAt: { gte: startOfMonth } }
    });

    // Calculate statistics
    const totalTags = tags.length;
    const activeTags = tags.filter(t => isActivated(t.status)).length;
    const foundItems = tags.filter(t => t.status === 'found').length;

    // Tags by agency type
    const tagsByType: Record<string, number> = {};
    tags.forEach(tag => {
      const typeName = tag.agency?.agencyType?.name || 'unassigned';
      tagsByType[typeName] = (tagsByType[typeName] || 0) + 1;
    });

    // Monthly revenue from completed payments
    const paymentsThisMonth = await db.payment.findMany({
      where: {
        status: 'completed',
        paidAt: { gte: startOfMonth }
      },
      select: { amount: true }
    });
    const monthlyRevenue = paymentsThisMonth.reduce((sum, p) => sum + p.amount, 0);

    // Get daily scans for the last 7 days
    const dailyScans: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayScans = await db.scanLog.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });

      dailyScans.push({
        day: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][date.getDay()],
        count: dayScans,
      });
    }

    // Get recent activities from scan logs
    const recentScans = await db.scanLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        tag: {
          select: {
            serialNumber: true,
            status: true,
            ownerName: true,
            itemName: true,
            agency: {
              select: { name: true }
            }
          }
        }
      }
    });

    // Format recent activities
    type ActivityType = {
      id: string;
      type: 'scan' | 'tag_generated' | 'agency_registered';
      name: string;
      reference: string;
      time: string;
      details: string;
      status: 'success' | 'warning' | 'info';
      agency?: string;
    };

    const recentActivities: ActivityType[] = recentScans.map((scan) => {
      const timeAgo = getTimeAgo(new Date(scan.createdAt));
      const name = scan.tag.ownerName
        ? `${scan.tag.ownerName} - ${scan.tag.itemName || 'Scan'}`
        : `Scan ${scan.tag.serialNumber}`;

      return {
        id: scan.id,
        type: 'scan' as const,
        name,
        reference: scan.tag.serialNumber,
        time: timeAgo,
        details: scan.location || 'Position non partagée',
        status: 'success' as const,
        agency: scan.tag.agency?.name,
      };
    });

    // If no scans, add recent tags as activity
    if (recentActivities.length === 0) {
      const recentTags = await db.tag.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { agency: { select: { name: true } } }
      });

      recentTags.forEach((tag, index) => {
        recentActivities.push({
          id: `tag-${index}`,
          type: 'tag_generated',
          name: `Tag créé: ${tag.serialNumber}`,
          reference: tag.serialNumber,
          time: getTimeAgo(new Date(tag.createdAt)),
          details: tag.ownerName || 'Non activé',
          status: 'info',
          agency: tag.agency?.name,
        });
      });
    }

    const stats = {
      totalTags,
      activeTags,
      foundItems,
      activeAgencies,
      monthlyRevenue,
      scansThisMonth,
      tagsByType,
    };

    return NextResponse.json({
      stats,
      dailyScans,
      recentActivities,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données' },
      { status: 500 }
    );
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return date.toLocaleDateString('fr-FR');
}
