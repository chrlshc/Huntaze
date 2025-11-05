import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ tourId: string; stepId: string }> }
) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { tourId, stepId } = params;

    // Get current progress
    const currentProgress = await db.query(
      `SELECT * FROM feature_tour_progress 
       WHERE user_id = $1 AND tour_id = $2`,
      [userId, tourId]
    );

    if (currentProgress.rows.length === 0) {
      // Create new progress record
      await db.query(
        `INSERT INTO feature_tour_progress 
         (user_id, tour_id, completed_steps, completed, dismissed_permanently, last_viewed_at)
         VALUES ($1, $2, $3, false, false, NOW())`,
        [userId, tourId, [stepId]]
      );
    } else {
      // Update existing progress
      const completedSteps = currentProgress.rows[0].completed_steps || [];
      if (!completedSteps.includes(stepId)) {
        completedSteps.push(stepId);
      }

      await db.query(
        `UPDATE feature_tour_progress 
         SET completed_steps = $1, last_viewed_at = NOW()
         WHERE user_id = $2 AND tour_id = $3`,
        [completedSteps, userId, tourId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing tour step:', error);
    return NextResponse.json(
      { error: 'Failed to complete tour step' },
      { status: 500 }
    );
  }
}
