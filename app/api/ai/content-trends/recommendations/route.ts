import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Import Content Trends Engine dynamically
    const { ContentTrendsEngine } = await import('@/lib/ai/content-trends');
    const contentTrendsEngine = new ContentTrendsEngine();

    const result = await contentTrendsEngine.getRecommendations({
      creatorId: parseInt(session.user.id),
    });

    return NextResponse.json({
      success: true,
      data: result.data || {
        recommendations: [],
        contentIdeas: [],
      },
    });
  } catch (error) {
    console.error('[API] Recommendations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'generate_ideas') {
      const { ContentTrendsEngine } = await import('@/lib/ai/content-trends');
      const contentTrendsEngine = new ContentTrendsEngine();

      const result = await contentTrendsEngine.generateContentIdeas({
        creatorId: parseInt(session.user.id),
        platforms: body.platforms || ['tiktok', 'instagram'],
        count: body.count || 4,
      });

      return NextResponse.json({
        success: true,
        data: result.data,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[API] Generate ideas error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
