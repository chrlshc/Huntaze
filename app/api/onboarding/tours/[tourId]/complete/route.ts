import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { tourId } = params;

    // Update or create tour progress as completed
    await db.query(
      `INSERT INTO feature_tour_progress 
       (user_id, tour_id, completed, dismissed_permanently, last_viewed_at)
       VALUES ($1, $2, true, false, NOW())
       ON CONFLICT (user_id, tour_id) 
       DO UPDATE SET completed = true, last_viewed_at = NOW()`,
      [userId, tourId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing tour:', error);
    return NextResponse.json(
      { error: 'Failed to complete tour' },
      { status: 500 }
    );
  }
}
