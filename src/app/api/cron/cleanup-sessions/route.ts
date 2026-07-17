import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredSessions } from '@/lib/session';

// Cron secret for authorization
const CRON_SECRET = process.env.CRON_SECRET || 'your-cron-secret-key';

/**
 * Cron endpoint to cleanup expired sessions
 * Should be called periodically (e.g., every hour)
 *
 * Setup with Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-sessions",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 *
 * Or call manually with:
 * curl -X POST https://your-domain.com/api/cron/cleanup-sessions \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    // Check for valid secret (skip in development)
    if (process.env.NODE_ENV === 'production' && token !== CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Run cleanup
    const deletedCount = await cleanupExpiredSessions();

    return NextResponse.json({
      success: true,
      deletedSessions: deletedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron cleanup error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500 }
    );
  }
}

// Also allow GET for Vercel Cron (which uses GET by default)
export async function GET(request: NextRequest) {
  return POST(request);
}
