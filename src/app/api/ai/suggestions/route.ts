import { NextRequest, NextResponse } from 'next/server';
import { getQRSuggestion, getGlobalQRSuggestion, getAIStatus } from '@/lib/ai-services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');
    const global = searchParams.get('global');
    const status = searchParams.get('status');

    // Get AI status
    if (status === 'true') {
      const aiStatus = await getAIStatus();
      return NextResponse.json({
        success: true,
        aiStatus
      });
    }

    // Get global suggestion
    if (global === 'true') {
      const suggestion = await getGlobalQRSuggestion();
      return NextResponse.json({
        success: true,
        suggestion
      });
    }

    // Get agency-specific suggestion
    if (agencyId) {
      const suggestion = await getQRSuggestion(agencyId);
      return NextResponse.json({
        success: true,
        suggestion
      });
    }

    // Default: return global suggestion
    const suggestion = await getGlobalQRSuggestion();
    return NextResponse.json({
      success: true,
      suggestion
    });
  } catch (error) {
    console.error('QR Suggestion API error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suggestion' },
      { status: 500 }
    );
  }
}
