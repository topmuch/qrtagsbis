import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all scan logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const baggageId = searchParams.get('baggageId');

    const where: Record<string, unknown> = {};
    
    if (baggageId) {
      where.baggageId = baggageId;
    }

    const logs = await db.scanLog.findMany({
      where,
      include: {
        baggage: {
          select: {
            reference: true,
            type: true,
            travelerFirstName: true,
            travelerLastName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await db.scanLog.count({ where });

    return NextResponse.json({
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Get logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
