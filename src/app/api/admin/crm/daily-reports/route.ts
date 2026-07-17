import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Get daily report for a specific date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    const userId = searchParams.get('userId');

    const date = dateStr ? new Date(dateStr) : new Date();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where: {
      date: { gte: Date; lte: Date };
      userId?: string;
    } = {
      date: { gte: startOfDay, lte: endOfDay }
    };

    if (userId) {
      where.userId = userId;
    }

    const reports = await db.dailyReport.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { date: 'desc' }
    });

    // Return single report if userId was specified
    if (userId) {
      return NextResponse.json({ report: reports[0] || null });
    }

    return NextResponse.json({ reports });

  } catch (error) {
    console.error('Get daily report error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Create or update daily report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, content, date } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId requis' },
        { status: 400 }
      );
    }

    const reportDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);

    // Check if report exists for this user and date
    const existingReport = await db.dailyReport.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    let report;

    if (existingReport) {
      // Update existing report
      report = await db.dailyReport.update({
        where: { id: existingReport.id },
        data: { content }
      });
    } else {
      // Create new report
      report = await db.dailyReport.create({
        data: {
          userId,
          content,
          date: reportDate
        }
      });
    }

    return NextResponse.json({ report });

  } catch (error) {
    console.error('Create/update daily report error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
