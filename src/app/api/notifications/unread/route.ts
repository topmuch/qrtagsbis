import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch unread notifications for SuperAdmin
export async function GET(request: NextRequest) {
  try {
    // Get all unread notifications (broadcast to superadmins)
    const notifications = await db.notification.findMany({
      where: {
        read: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
