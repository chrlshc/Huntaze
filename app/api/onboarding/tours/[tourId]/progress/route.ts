import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { tourId } = params;

    // Get tour progress from database
    const result = await db.query(
      `SELECT * FROM feature_tour_progress 
       WHERE user_id = $1 AND tour_id = $2`,
      [userId, tourId]
    );

    if (result.rows.length === 0) {
      // No progress yet - return default
      return NextResponse.json({
        userId,
        tourId,
        completedSteps: [],
        completed: false,
        dismissedPermanently: false,
        lastViewedAt: null,
      });
    }

    const progress = result.rows[0];
    return NextResponse.json({
      userId: progress.user_id,
      tourId: progress.tour_id,
      completedSteps: progress.completed_steps || [],
      completed: progress.completed,
      dismissedPermanently: progress.dismissed_permanently,
      lastViewedAt: progress.last_viewed_at,
    });
  } catch (error) {
    console.error('Error fetching tour progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tour progress' },
      { status: 500 }
    );
  }
}
