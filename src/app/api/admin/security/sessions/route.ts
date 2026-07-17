import { NextResponse } from 'next/server';
import { getSession, getActiveSessions } from '@/lib/session';

/**
 * GET /api/admin/security/sessions
 * Get all active sessions (SuperAdmin only)
 */
export async function GET() {
  try {
    // Check authentication and authorization
    const user = await getSession();

    if (!user || user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Get all active sessions with user data
    const sessions = await getActiveSessions();

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des sessions' },
      { status: 500 }
    );
  }
}
