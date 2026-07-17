import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Mark notification as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const notification = await db.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
