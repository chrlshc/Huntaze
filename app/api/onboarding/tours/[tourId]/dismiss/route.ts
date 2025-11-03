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

    // Mark tour as permanently dismissed
    await db.query(
      `INSERT INTO feature_tour_progress 
       (user_id, tour_id, completed, dismissed_permanently, last_viewed_at)
       VALUES ($1, $2, false, true, NOW())
       ON CONFLICT (user_id, tour_id) 
       DO UPDATE SET dismissed_permanently = true, last_viewed_at = NOW()`,
      [userId, tourId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error dismissing tour:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss tour' },
      { status: 500 }
    );
  }
}
