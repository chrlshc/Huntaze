import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentId, scheduledAt, platforms } = body;

    if (!contentId) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    if (!scheduledAt) {
      return NextResponse.json(
        { error: 'Scheduled date/time is required' },
        { status: 400 }
      );
    }

    // Validate that scheduled time is at least 5 minutes in the future
    const scheduledDate = new Date(scheduledAt);
    const now = new Date();
    const minScheduleTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now

    if (scheduledDate < minScheduleTime) {
      return NextResponse.json(
        { error: 'Scheduled time must be at least 5 minutes in the future' },
        { status: 400 }
      );
    }

    // Update content item status to scheduled
    await db.query(
      `UPDATE content_items 
       SET status = 'scheduled', 
           scheduled_at = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [scheduledDate, contentId]
    );

    // Update platform associations if provided
    if (platforms && Array.isArray(platforms)) {
      // Delete existing platform associations
      await db.query(
        'DELETE FROM content_platforms WHERE content_id = $1',
        [contentId]
      );

      // Insert new platform associations
      for (const platform of platforms) {
        await db.query(
          `INSERT INTO content_platforms (content_id, platform)
           VALUES ($1, $2)
           ON CONFLICT (content_id, platform) DO NOTHING`,
          [contentId, platform]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Content scheduled successfully',
      scheduledAt: scheduledDate.toISOString()
    });
  } catch (error) {
    console.error('Scheduling error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule content' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let query = `
      SELECT 
        ci.id,
        ci.text,
        ci.scheduled_at,
        ci.status,
        ci.created_at,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'platform', cp.platform,
              'published_url', cp.published_url,
              'published_at', cp.published_at
            )
          ) FILTER (WHERE cp.platform IS NOT NULL),
          '[]'
        ) as platforms,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', ma.id,
              'type', ma.type,
              'thumbnail_url', ma.thumbnail_url
            )
          ) FILTER (WHERE ma.id IS NOT NULL),
          '[]'
        ) as media
      FROM content_items ci
      LEFT JOIN content_platforms cp ON ci.id = cp.content_id
      LEFT JOIN content_media cm ON ci.id = cm.content_id
      LEFT JOIN media_assets ma ON cm.media_id = ma.id
      WHERE ci.user_id = $1 AND ci.status = 'scheduled'
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND ci.scheduled_at >= $${paramIndex}`;
      params.push(new Date(startDate));
      paramIndex++;
    }

    if (endDate) {
      query += ` AND ci.scheduled_at <= $${paramIndex}`;
      params.push(new Date(endDate));
      paramIndex++;
    }

    query += `
      GROUP BY ci.id
      ORDER BY ci.scheduled_at ASC
    `;

    const result = await db.query(query, params);

    return NextResponse.json({
      success: true,
      scheduledContent: result.rows
    });
  } catch (error) {
    console.error('Error fetching scheduled content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled content' },
      { status: 500 }
    );
  }
}
