import { NextRequest, NextResponse } from 'next/server';
import { platformOptimizerService } from '@/lib/services/platformOptimizerService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageWidth, imageHeight, platform, aspectRatio } = body;

    if (!imageWidth || !imageHeight) {
      return NextResponse.json(
        { error: 'Image dimensions (width and height) are required' },
        { status: 400 }
      );
    }

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      );
    }

    // Calculate optimal dimensions
    const optimalDimensions = platformOptimizerService.calculateOptimalDimensions(
      imageWidth,
      imageHeight,
      platform,
      aspectRatio
    );

    // Get resize recommendation
    const recommendation = platformOptimizerService.getImageResizeRecommendation(
      imageWidth,
      imageHeight,
      platform
    );

    return NextResponse.json({
      success: true,
      currentDimensions: { width: imageWidth, height: imageHeight },
      optimalDimensions: {
        width: optimalDimensions.width,
        height: optimalDimensions.height
      },
      needsResize: optimalDimensions.needsResize,
      recommendation
    });
  } catch (error) {
    console.error('Image optimization calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate image optimization', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
