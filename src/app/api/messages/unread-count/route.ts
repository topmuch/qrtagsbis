import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Unread messages count for notifications
export async function GET() {
  try {
    const count = await db.message.count({
      where: { status: 'non_lu' },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json({ count: 0 });
  }
}
