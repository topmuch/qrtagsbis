import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuthApi } from '@/lib/auth-middleware';

// GET - List payments with filters and stats
export async function GET(request: NextRequest) {
  try {
    await requireAuthApi();

    const { searchParams } = new URL(request.url);
    const method = searchParams.get('method');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (method) where.method = method;
    if (status) where.status = status;

    // Get payments
    const payments = await db.payment.findMany({
      where,
      include: {
        agency: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // Calculate stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const completedThisMonth = await db.payment.findMany({
      where: {
        status: 'completed',
        paidAt: { gte: startOfMonth }
      },
      select: { amount: true, method: true }
    });

    const revenueThisMonth = completedThisMonth.reduce((sum, p) => sum + p.amount, 0);

    const pendingPayments = await db.payment.aggregate({
      where: { status: 'pending' },
      _sum: { amount: true }
    });

    const mobileMoneyMethods = ['wave', 'orange_money', 'mtn_money'];
    const mobileMoneyTotal = completedThisMonth
      .filter(p => mobileMoneyMethods.includes(p.method))
      .reduce((sum, p) => sum + p.amount, 0);

    const cardTotal = completedThisMonth
      .filter(p => p.method === 'card')
      .reduce((sum, p) => sum + p.amount, 0);

    const stats = {
      revenueThisMonth,
      pendingPayments: pendingPayments._sum.amount || 0,
      mobileMoneyTotal,
      cardTotal,
    };

    return NextResponse.json({ payments, stats });
  } catch (error) {
    console.error('Error fetching payments:', error);
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
