import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const timeframe = searchParams.get('timeframe') || '24h';
    const category = searchParams.get('category');

    // Import Content Trends Engine dynamically
    const { ContentTrendsEngine } = await import('@/lib/ai/content-trends');
    const contentTrendsEngine = new ContentTrendsEngine();

    // Get trending content
    const result = await contentTrendsEngine.getTrends({
      creatorId: parseInt(session.user.id),
      platform,
      timeframe,
      category,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Trends fetch failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      usage: result.usage,
    });

  } catch (error) {
    console.error('[API] Content trends error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
