/**
 * Reddit Posts Endpoint
 * 
 * Get user's Reddit posts with optional filtering
 * 
 * @route GET /api/reddit/posts
 */

import { NextRequest, NextResponse } from 'next/server';
import { redditPostsRepository } from '@/lib/db/repositories/redditPostsRepository';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subreddit = searchParams.get('subreddit');
    const limit = parseInt(searchParams.get('limit') || '50');

    // TODO: Get actual user ID from session/JWT
    const userId = 1;

    // Get posts
    let posts;
    if (subreddit) {
      posts = await redditPostsRepository.findBySubreddit(userId, subreddit, limit);
    } else {
      posts = await redditPostsRepository.findByUser(userId, limit);
    }

    // Get statistics
    const stats = await redditPostsRepository.getStatistics(userId);

    return NextResponse.json({
      success: true,
      data: {
        posts,
        statistics: stats,
      },
    });
  } catch (error) {
    console.error('Reddit posts fetch error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch posts',
        },
      },
      { status: 500 }
    );
  }
}
