import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuthApi } from '@/lib/auth-middleware';

// GET - List subscriptions with filters
export async function GET(request: NextRequest) {
  try {
    await requireAuthApi();

    const { searchParams } = new URL(request.url);
    const plan = searchParams.get('plan');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (plan) where.plan = plan;
    if (status) where.status = status;

    const subscriptions = await db.subscription.findMany({
      where,
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            agencyType: { select: { name: true, label: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Update subscription (renew, upgrade, cancel)
export async function PATCH(request: NextRequest) {
  try {
    await requireAuthApi();

    const body = await request.json();
    const { id, action, plan, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de l\'abonnement requis' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    switch (action) {
      case 'renew': {
        // Extend subscription by one billing cycle
        const sub = await db.subscription.findUnique({ where: { id } });
        if (!sub) return NextResponse.json({ error: 'Abonnement non trouvé' }, { status: 404 });

        const currentEnd = sub.endDate ? new Date(sub.endDate) : new Date();
        const newEnd = new Date(currentEnd);
        if (sub.billingCycle === 'monthly') {
          newEnd.setMonth(newEnd.getMonth() + 1);
        } else {
          newEnd.setFullYear(newEnd.getFullYear() + 1);
        }
        updateData.status = 'active';
        updateData.endDate = newEnd;
        break;
      }
      case 'upgrade': {
        if (!plan) return NextResponse.json({ error: 'Plan requis pour upgrader' }, { status: 400 });
        updateData.plan = plan;
        // Update limits based on plan
        if (plan === 'pro') {
          updateData.maxTags = 500;
          updateData.maxUsers = 20;
          updateData.maxScans = 5000;
          updateData.amount = 15000;
        } else if (plan === 'enterprise') {
          updateData.maxTags = -1; // unlimited
          updateData.maxUsers = -1;
          updateData.maxScans = -1;
          updateData.amount = 50000;
        }
        break;
      }
      case 'cancel': {
        updateData.status = 'cancelled';
        break;
      }
      default: {
        // Direct status update
        if (status) updateData.status = status;
        if (plan) updateData.plan = plan;
      }
    }

    const subscription = await db.subscription.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error updating subscription:', error);
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
