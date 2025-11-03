import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Lazy import to avoid build-time instantiation
  const { aiContentService } = await import('@/lib/services/aiContentService');
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, context } = body;

    if (!type) {
      return NextResponse.json(
        { error: { code: 'MISSING_TYPE', message: 'Suggestion type is required' } },
        { status: 400 }
      );
    }

    const userAnalysis = await aiContentService.analyzeUserContent(userId);
    const suggestions = await aiContentService.generateSuggestions({ type, context, userHistory: userAnalysis });

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        userInsights: {
          topPerformingContent: userAnalysis.topPerformingContent,
          recommendedTopics: userAnalysis.recommendedTopics,
        },
      },
    });

  } catch (error: any) {
    console.error('AI suggestions error:', error);
    return NextResponse.json(
      { error: { code: 'AI_FAILED', message: error.message || 'Failed to generate suggestions' } },
      { status: 500 }
    );
  }
}
