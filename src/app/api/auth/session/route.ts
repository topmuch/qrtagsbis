import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// Get current session from server-side cookie
export async function GET() {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        user: null
      });
    }

    return NextResponse.json({
      authenticated: true,
      user
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 500 }
    );
  }
}
