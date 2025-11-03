import { NextRequest, NextResponse } from 'next/server';
import { platformOptimizerService } from '@/lib/services/platformOptimizerService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platforms, content } = body;

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Platforms array is required' },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: 'Content object is required' },
        { status: 400 }
      );
    }

    // Validate content for all selected platforms
    const results = platformOptimizerService.validateMultiplePlatforms(platforms, content);

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Content optimization error:', error);
    return NextResponse.json(
      { error: 'Failed to optimize content' },
      { status: 500 }
    );
  }
}
