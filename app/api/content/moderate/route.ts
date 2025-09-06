import { NextRequest, NextResponse } from 'next/server';
import { contentModeration } from '@/src/services/content-moderation';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { imageUrl, platform, subreddit, checkCrossPlatform } = await request.json();

    if (!imageUrl || !platform) {
      return NextResponse.json({ 
        error: 'Missing required fields: imageUrl, platform' 
      }, { status: 400 });
    }

    // Single platform check
    if (!checkCrossPlatform) {
      const result = await contentModeration.checkImage(imageUrl, platform, subreddit);
      return NextResponse.json(result);
    }

    // Cross-platform check
    const platforms = ['instagram', 'tiktok', 'reddit', 'threads', 'onlyfans'];
    const results = await contentModeration.checkCrossPosting(
      imageUrl, 
      platform,
      platforms.filter(p => p !== platform)
    );

    // Summary of where content can be posted
    const summary = {
      safeForAll: Object.values(results).every(r => r.safe),
      safePlatforms: Object.entries(results)
        .filter(([_, result]) => result.safe)
        .map(([platform]) => platform),
      unsafePlatforms: Object.entries(results)
        .filter(([_, result]) => !result.safe)
        .map(([platform]) => platform),
      recommendations: [] as string[]
    };

    // Aggregate recommendations
    Object.values(results).forEach(result => {
      if (result.recommendations) {
        summary.recommendations.push(...result.recommendations);
      }
    });

    // Remove duplicates
    summary.recommendations = [...new Set(summary.recommendations)];

    return NextResponse.json({ 
      results, 
      summary,
      message: summary.safeForAll 
        ? 'Content is safe for all platforms' 
        : `Content is safe for: ${summary.safePlatforms.join(', ')}`
    });

  } catch (error: any) {
    console.error('Content moderation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to moderate content' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { images, maxConcurrent = 5 } = await request.json();

    if (!images || !Array.isArray(images)) {
      return NextResponse.json({ 
        error: 'Missing required field: images (array)' 
      }, { status: 400 });
    }

    // Batch moderation
    const results = await contentModeration.checkBatch(images, maxConcurrent);

    // Summary statistics
    const stats = {
      total: results.length,
      safe: results.filter(r => r.safe).length,
      unsafe: results.filter(r => !r.safe).length,
      byPlatform: {} as Record<string, { safe: number; unsafe: number }>
    };

    // Calculate per-platform stats
    results.forEach(result => {
      if (!stats.byPlatform[result.platform]) {
        stats.byPlatform[result.platform] = { safe: 0, unsafe: 0 };
      }
      if (result.safe) {
        stats.byPlatform[result.platform].safe++;
      } else {
        stats.byPlatform[result.platform].unsafe++;
      }
    });

    return NextResponse.json({ results, stats });

  } catch (error: any) {
    console.error('Batch moderation error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to moderate batch' 
    }, { status: 500 });
  }
}